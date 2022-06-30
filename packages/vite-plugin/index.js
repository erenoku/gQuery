import { generate } from '@graphql-codegen/cli';
import { execaCommand } from 'execa';
// Only load up graphql, graphqls or gql files
const filterExt = /\.(graphqls?|gql)$/i;
// Delete all gq (generated) files
async function cleanGQ({ debug = false }) {
    debug && console.log('🧹 removing all .gq files');
    // Find and remove all .gq files
    await execaCommand("find ./ -path '*.gq.ts' -type f -prune -print -exec rm -f '{}' +; ", {
        stdio: debug ? 'inherit' : 'ignore',
        shell: true
    });
}
// Runs graphql codegen
async function gQueryGenerate({ schema, out, gPath, debug = false }) {
    debug && console.log('🤖 starting codegen');
    // the actual codegen process.
    await generate({
        schema,
        documents: './src/**/*.graphql',
        generates: {
            // * Generates the types for your schema
            [`${process.cwd()}/${out}/types.gq.ts`]: {
                plugins: ['typescript']
            },
            // * Generates near file .ts files for your fetch functions
            [`${process.cwd()}/${out}`]: {
                config: {
                    useTypeImports: true,
                    gPath,
                    debug,
                    importDocumentNodeExternallyFrom: 'near-operation-file',
                    inlineFragmentTypes: 'combine'
                },
                preset: 'near-operation-file',
                presetConfig: {
                    extension: '.gq.ts',
                    folder: './',
                    baseTypesPath: `types.gq.ts`
                },
                plugins: [
                    'typescript-operations',
                    '@leveluptuts/g-query-codegen' // g-query codegen plugin. ./codegen.ts
                ]
            }
        }
    }, true);
}
export function gQueryCodegen({ schema, out, gPath, debug = false }) {
    if (!schema) {
        throw new Error('No schema provided');
    }
    if (!out) {
        throw new Error('No output directory specified for types. Please specify "out" property in generator plugin.');
    }
    if (!gPath) {
        throw new Error("No gPath directory specified. gPath is where you've initialized the 'g' client. See gquery.leveluptutorials.com");
    }
    return {
        name: 'g-query-codegen',
        async buildStart() {
            // This runs on the initial run of gQuery
            console.log('🤖 gQuery Generation Start');
            try {
                // Remove all generated files
                await cleanGQ({ debug });
                // Generate new files
                await gQueryGenerate({ schema, out, gPath, debug });
                return;
            }
            catch (e) {
                console.log('❓ gQuery Error - Something Happened - Here is the error and some things to consider.', e);
                console.log('❓ gQuery Error - Make sure `.graphql` are files exist.');
            }
            return;
        },
        configureServer(server) {
            const listener = async (absolutePath = '') => {
                if (!filterExt.test(absolutePath))
                    return null;
                try {
                    // Remove all generated files
                    await cleanGQ({ debug });
                    // Generate new files
                    await gQueryGenerate({ schema, out, gPath, debug });
                }
                catch (error) {
                    console.log('❓ gQuery Error - Something went wrong. Please save the file again.');
                }
            };
            // Run generation on file change or add
            server.watcher.on('add', listener);
            server.watcher.on('change', listener);
        }
    };
}
//# sourceMappingURL=index.js.map