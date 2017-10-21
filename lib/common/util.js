import Module from 'module'
import { join, resolve } from 'path'

export default {

    resolvePath (path, {rootDir,srcDir, nodeModulePaths}) {
        // Try to resolve using NPM resolve path first
        try {
            let resolvedPath = Module._resolveFilename(path, { paths: nodeModulePaths })
            return resolvedPath
        } catch (e) {
            // Just continue
        }
        // Shorthand to resolve from project dirs
        if (path.indexOf('@@') === 0 || path.indexOf('~~') === 0) {
            return join(rootDir, path.substr(2))
        } else if (path.indexOf('@') === 0 || path.indexOf('~') === 0) {
            return join(srcDir, path.substr(1))
        }
        return resolve(srcDir, path)
    }
}