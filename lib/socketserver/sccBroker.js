import scClusterBrokerClient from 'scc-broker-client'
import Debug from 'debug'

const debug = Debug('scc-broker:')
debug.color = 5

module.exports.run = function (broker) {
    debug('   >> Broker PID:', process.pid)

    // This is defined in server.js (taken from environment variable SC_CLUSTER_STATE_SERVER_HOST).
    // If this property is defined, the broker will try to attach itself to the SC cluster for
    // automatic horizontal scalability.
    // This is mostly intended for the Kubernetes deployment of SocketCluster - In this case,
    // The clustering/sharding all happens automatically.

    if (broker.options.clusterStateServerHost) {
        scClusterBrokerClient.attach(broker, {
            stateServerHost: broker.options.clusterStateServerHost,
            stateServerPort: broker.options.clusterStateServerPort,
            authKey: broker.options.clusterAuthKey,
            stateServerConnectTimeout: broker.options.clusterStateServerConnectTimeout,
            stateServerAckTimeout: broker.options.clusterStateServerAckTimeout,
            stateServerReconnectRandomness: broker.options.clusterStateServerReconnectRandomness
        })
    }
}
