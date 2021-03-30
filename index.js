import logging
import boto3
import json

# Initialize logger and set log level
# logger = logging.getLogger()
# logger.setLevel(logging.INFO)

# Initialize SNS client for Ireland region
session = boto3.Session(
    region_name="ap-southeast-1"
)
sqs_session = boto3.Session(
    region_name="ap-northeast-2"
)

sns_client = session.client('sns')
sqs_client = sqs_session.client('sqs')

def lambda_handler(event, context):
    print('event')
    print(event)
    print(event['Records'][0]['messageAttributes']['phone_number']['stringValue'])
    # Send message
    response = sns_client.publish(
        PhoneNumber=event['Records'][0]['messageAttributes']['phone_number']['stringValue'],
        Message=event['Records'][0]['body'],
        MessageAttributes={
            'AWS.SNS.SMS.SenderID': {
                'DataType': 'String',
                'StringValue': 'Showprise'
            },
            'AWS.SNS.SMS.SMSType': {
                'DataType': 'String',
                'StringValue': 'Promotional'
            }
        }
    )

    print(response)
    sqsMsg = json.dumps(response);

    response = sqs_client.delete_message(
        QueueUrl='https://sqs.ap-northeast-2.amazonaws.com/xxxxxxxx/dev-showprise-sms-sqs',
        ReceiptHandle=event['Records'][0]['receiptHandle']
    )
    print('response')
    print(response)

    response = sqs_client.send_message(
        QueueUrl= 'https://sqs.ap-northeast-2.amazonaws.com/xxxxxxxxx/dev-showprise-sms-result-sqs',
        MessageBody= sqsMsg,
        MessageAttributes={
            'phone_number': {
              'DataType': 'String',
              'StringValue': event['Records'][0]['messageAttributes']['phone_number']['stringValue']
            }
        }
    )

    print('send response')
    print(response)

    return 'OK'
