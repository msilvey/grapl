export interface LogLevels<T> {
    // (optional) The log level for services, ex: debug
    defaultLogLevel: T;
    // (optional) Override log levels for services
    sysmonSubgraphGeneratorLogLevel: T;
    osquerySubgraphGeneratorLogLevel: T;
    nodeIdentifierLogLevel: T;
    graphMergerLogLevel: T;
    analyzerDispatcherLogLevel: T;
    analyzerExecutorLogLevel: T;
    engagementCreatorLogLevel: T;
}

export class DeploymentParameters {
    stackName: string;
    graplVersion: string;
    watchfulEmail: string | undefined;
    operationalAlarmsEmail: string;
    securityAlarmsEmail: string;
    region: string;

    logLevels: LogLevels<string>;

    constructor() {
        // I'd like to remove this relatively ASAP.
        const allowLegacyDeploymentName =
            boolFromEnvVar(process.env.GRAPL_ALLOW_LEGACY_DEPLOYMENT_NAME) ||
            false;

        // ex: 'grapl-my-deployment'
        const deployName = process.env.DEPLOYMENT_NAME;
        if (!deployName) {
            throw new Error(
                "Error: Missing Grapl deployment name. Set via bin/deployment_parameters.ts, or environment variable DEPLOYMENT_NAME."
            );
        }
        validateDeploymentName(deployName, allowLegacyDeploymentName);

        this.stackName = deployName;

        // defaults to 'latest'
        this.graplVersion = process.env.GRAPL_VERSION || "latest";

        // ex: ops@example.com
        this.watchfulEmail = process.env.GRAPL_CDK_WATCHFUL_EMAIL;

        const _operationalAlarmsEmail =
            process.env.GRAPL_CDK_OPERATIONAL_ALARMS_EMAIL;
        if (!_operationalAlarmsEmail) {
            throw new Error(
                "Error: Missing operational alarms email. Set via bin/deployment_parameters.ts, or environment variable GRAPL_CDK_OPERATIONAL_ALARMS_EMAIL."
            );
        }
        this.operationalAlarmsEmail = _operationalAlarmsEmail;

        const _securityAlarmsEmail =
            process.env.GRAPL_CDK_SECURITY_ALARMS_EMAIL;
        if (!_securityAlarmsEmail) {
            throw new Error(
                "Error: Missing security alarms email. Set via bin/deployment_parameters.ts, or environment variable GRAPL_CDK_SECURITY_ALARMS_EMAIL."
            );
        }
        this.securityAlarmsEmail = _securityAlarmsEmail;

        // AWS region for this Grapl deployment
        const region = process.env.GRAPL_REGION;
        if (!region) {
            throw new Error(
                "Error: Missing Grapl region. Set via bin/deployment_parameters.ts or environment variable GRAPL_REGION."
            );
        }
        this.region = region;

        const defaultLogLevel = process.env.DEFAULT_LOG_LEVEL || "INFO";

        this.logLevels = {
            defaultLogLevel: defaultLogLevel,

            sysmonSubgraphGeneratorLogLevel:
                process.env.SYSMON_SUBGRAPH_GENERATOR_LOG_LEVEL ||
                defaultLogLevel,

            osquerySubgraphGeneratorLogLevel:
                process.env.OSQUERY_SUBGRAPH_GENERATOR_LOG_LEVEL ||
                defaultLogLevel,

            nodeIdentifierLogLevel:
                process.env.NODE_IDENTIFIER_LOG_LEVEL || defaultLogLevel,

            graphMergerLogLevel:
                process.env.GRAPH_MERGER_LOG_LEVEL || defaultLogLevel,

            analyzerDispatcherLogLevel:
                process.env.ANALYZER_DISPATCHER_LOG_LEVEL || defaultLogLevel,

            analyzerExecutorLogLevel:
                process.env.ANALYZER_EXECUTOR_LOG_LEVEL || defaultLogLevel,

            engagementCreatorLogLevel:
                process.env.ENGAGEMENT_CREATOR_LOG_LEVEL || defaultLogLevel,
        };
    }
}

function boolFromEnvVar(envVar: string | undefined): boolean | undefined {
    if (envVar) {
        return JSON.parse(envVar.toLowerCase());
    }
    return undefined;
}
// ^ and $ capture the whole string: start and end
// Must start with an alpha
// Must end with an alpha or number
// In the middle, - and _ are fine
const regex = /^[a-z]([a-z0-9_-]?[a-z0-9]+)*$/;
export function validateDeploymentName(
    deploymentName: string,
    allowLegacyDeploymentName: boolean
) {
    if (allowLegacyDeploymentName) {
        return;
    }
    if (!regex.test(deploymentName)) {
        throw new Error(
            `Deployment name "${deploymentName}" is invalid - should match regex ${regex}.` +
                "(You can, temporarily, allow this with GRAPL_ALLOW_LEGACY_DEPLOYMENT_NAME=true)."
        );
    }
}
