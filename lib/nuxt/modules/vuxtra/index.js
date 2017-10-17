import path from 'path'

export default function vuxtra (moduleOptions) {
    this.addPlugin({
        src: path.resolve(__dirname,  'plugin.es.js'),
        options: moduleOptions
    })
}