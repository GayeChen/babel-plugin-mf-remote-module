/*
 * @Author: chengxiao01
 * @Date: 2022-03-18 14:04:54
 * @LastEditTime: 2022-03-20 10:35:34
 * @LastEditors: Please set LastEditors
 * @Description: chengxiao01
 * @FilePath: /fe-mall-pc/packages/mall-cli/src/utils/babel-plugin-mf-remote-module.js
 */
const NOT_DEFAULT_LIBS = [
    'react',
    'react-dom',
];

module.exports = function (babel) {
    const {types: t} = babel;
    return {
        name: 'transform-mf-container',
        visitor: {
            ExpressionStatement(path, state) {
                const node = path.node.expression;
                const {
                    remoteName = 'common', // remoteContainer的名称
                    remoteAlias = '@common', // import远程容器的别名
                    context = 'window', // 远程容器的挂载点
                    getMethodName = 'get', // 远程容器上获取模块的方法名
                } = state.opts;
                if (t.isImport(node.callee) && node.arguments) {
                    const request = node.arguments[0].value;
                    if (request.startsWith(remoteAlias)) {
                        const moduleName = '.' + request.slice(remoteAlias.length, request.length);
                        const memberExpress = t.memberExpression(
                            t.memberExpression(
                                t.identifier(context),
                                t.identifier(remoteName)
                            ),
                            t.identifier(getMethodName)
                        );
                        path.replaceWith(t.callExpression(
                            t.awaitExpression(
                                t.callExpression(memberExpress, [t.stringLiteral(moduleName)])
                            ),
                            []
                        ));
                    }
                }
            },
            ImportDeclaration(path, state) {
                const {node} = path;
                const request = node.source.value;
                const {
                    remoteName = 'common', // remoteContainer的名称
                    remoteAlias = '@common', // import远程容器的别名
                    context = 'window', // 远程容器的挂载点
                    getMethodName = 'get', // 远程容器上获取模块的方法名
                } = state.opts;
                if (request.startsWith(remoteAlias)) {
                    const hoistedDestructuringProperties = [];
                    let defaultVariableId = null;
                    for (const specifier of node.specifiers) {
                        // 默认导出, 没有imported只有local
                        if (t.isImportDefaultSpecifier(specifier)) {
                            defaultVariableId = t.cloneNode(specifier.local);
                        }
                        const {imported, local} = specifier;
                        if (imported) {
                            hoistedDestructuringProperties.push(
                                t.objectProperty(
                                    imported,
                                    local,
                                    false,
                                    true
                                )
                            );
                        }
                    }
                    const libName = request.slice(remoteAlias.length + 1, request.length);
                    const libIsNotDefaultImport = NOT_DEFAULT_LIBS.includes(libName);
                    const moduleRealUrl = './' + libName;
                    const memberExpress = t.memberExpression(
                        t.memberExpression(
                            t.identifier(context),
                            t.identifier(remoteName)
                        ),
                        t.identifier(getMethodName)
                    );
                    // 解构导入的variableDeclarator入参：id和init
                    const variableDeclaratorId = t.objectPattern(hoistedDestructuringProperties);
                    const variableDeclaratorInit = t.callExpression(
                        t.awaitExpression(
                            t.callExpression(memberExpress, [t.stringLiteral(moduleRealUrl)])
                        ),
                        []
                    );
                    let defaultVariableDeclaratorInit = null;
                    // 默认导入的时候需要xxxx.default
                    if (defaultVariableId) {
                        defaultVariableDeclaratorInit = t.memberExpression(
                            variableDeclaratorInit, t.identifier('default')
                        );
                    }
                    // 同时存在默认导出和解构导出
                    const defaultAndDestruct = defaultVariableId && hoistedDestructuringProperties.length;
                    if (defaultAndDestruct) {
                        path.replaceWithMultiple([
                            t.variableDeclaration('const', [
                                t.variableDeclarator(
                                    defaultVariableId,
                                    libIsNotDefaultImport ? variableDeclaratorInit : defaultVariableDeclaratorInit
                                ),
                            ]),
                            t.variableDeclaration('const', [
                                t.variableDeclarator(
                                    variableDeclaratorId,
                                    defaultVariableId
                                ),
                            ]),
                        ]);
                    }
                    else {
                        // 直接将整个import类型node替换为 变量/常量声明类型node
                        path.replaceWith(
                            t.variableDeclaration('const', [
                                t.variableDeclarator(
                                    defaultVariableId ? defaultVariableId : variableDeclaratorId,
                                    defaultVariableId && !libIsNotDefaultImport
                                        ? defaultVariableDeclaratorInit
                                        : variableDeclaratorInit
                                ),
                            ])
                        );
                    }
                }
            },
        },
    };
};