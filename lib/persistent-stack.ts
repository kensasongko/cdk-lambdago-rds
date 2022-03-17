import { App, Stack, StackProps, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

import { DatabaseConstruct } from '../lib/database-construct';

interface PersistentStackProps extends StackProps {
  removalPolicy: RemovalPolicy,
  rdsInstanceType: ec2.InstanceType,
  rdsBackupRetentionDays: Duration,
  rdsSecretRotationDays: Duration,
}

export class PersistentStack extends Stack {
  public readonly database: DatabaseConstruct;

  constructor(scope: App, id: string, props: PersistentStackProps) {
    super(scope, id, props);

    this.database = new DatabaseConstruct(this, 'DatabaseConstruct', {
      removalPolicy: props.removalPolicy,
      rdsInstanceType: props.rdsInstanceType,
      rdsBackupRetentionDays: props.rdsBackupRetentionDays,
      rdsSecretRotationDays: props.rdsSecretRotationDays,
    }); 

    // S3, DocumentDB, etc.. goes here
  }
}

