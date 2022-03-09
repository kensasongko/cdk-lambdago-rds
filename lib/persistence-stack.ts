import { App, Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

import { DatabaseConstruct } from '../lib/database-construct';

interface PersistenceStackProps extends StackProps {
  removalPolicy: RemovalPolicy,
  rdsScalingAutoPauseMinutes: Duration,
  rdsScalingMinCapacity: rds.AuroraCapacityUnit,
  rdsScalingMaxCapacity: rds.AuroraCapacityUnit,
  rdsBackupRetentionDays: Duration,
  rdsSecretRotationDays: Duration,
}

export class PersistenceStack extends Stack {
  public readonly databaseConstruct: DatabaseConstruct;

  constructor(scope: App, id: string, props: PersistenceStackProps) {
    super(scope, id, props);

    this.databaseConstruct = new DatabaseConstruct(this, 'DatabaseConstruct', {
      removalPolicy: props.removalPolicy,
      rdsScalingAutoPauseMinutes: props.rdsScalingAutoPauseMinutes,
      rdsScalingMinCapacity: props.rdsScalingMinCapacity,
      rdsScalingMaxCapacity: props.rdsScalingMaxCapacity,
      rdsBackupRetentionDays: props.rdsBackupRetentionDays,
      rdsSecretRotationDays: props.rdsSecretRotationDays,
    }); 

    // S3, DocumentDB, etc.. goes here
  }
}

