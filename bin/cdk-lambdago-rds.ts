#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from "aws-cdk-lib/aws-ec2";

import { PersistenceStack } from '../lib/persistence-stack';
import { ComputeStack } from '../lib/compute-stack';
//import { MonitoringStack } from "../lib/monitoring-stack";

const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };
const devEnv = env;
const prodEnv = env;

const app = new cdk.App();

const devPersistenceStack = new PersistenceStack(app, 'DevPersistenceStack', {
  env: devEnv,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  rdsScalingAutoPauseMinutes: cdk.Duration.minutes(5),
  rdsScalingMinCapacity: rds.AuroraCapacityUnit.ACU_2,
  rdsScalingMaxCapacity: rds.AuroraCapacityUnit.ACU_8,
  rdsBackupRetentionDays: cdk.Duration.days(1),
  rdsSecretRotationDays: cdk.Duration.days(1),
});

const devComputeStack = new ComputeStack(app, 'DevComputeStack', {
  env: devEnv,
  bastionInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MICRO),
  rdsAccessSg: devPersistenceStack.database.accessSg,
  rdsUserSecret: devPersistenceStack.database.userSecret,
  usersLambdaTimeout: cdk.Duration.seconds(10),
});
devComputeStack.addDependency(devPersistenceStack);

/*
new MonitoringStack(app, 'DevMonitoringStack', {
  env: devEnv,
});
*/

const prodPersistenceStack = new PersistenceStack(app, 'ProdPersistenceStack', {
  env: prodEnv,
  removalPolicy: cdk.RemovalPolicy.RETAIN,
  rdsScalingAutoPauseMinutes: cdk.Duration.minutes(5),
  rdsScalingMinCapacity: rds.AuroraCapacityUnit.ACU_4,
  rdsScalingMaxCapacity: rds.AuroraCapacityUnit.ACU_16,
  rdsBackupRetentionDays: cdk.Duration.days(30),
  rdsSecretRotationDays: cdk.Duration.days(14),
});

const prodComputeStack = new ComputeStack(app, 'ProdComputeStack', {
  env: prodEnv,
  bastionInstanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3_AMD, ec2.InstanceSize.MICRO),
  rdsAccessSg: prodPersistenceStack.database.accessSg,
  rdsUserSecret: prodPersistenceStack.database.userSecret,
  usersLambdaTimeout: cdk.Duration.seconds(20),
});
prodComputeStack.addDependency(prodPersistenceStack);

/*
new MonitoringStack(app, 'ProdMonitoringStack', {
  env: prodEnv,
});
*/
