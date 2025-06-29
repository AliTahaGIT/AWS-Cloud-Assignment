import boto3, os
from dotenv import load_dotenv
from botocore.exceptions import ClientError

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
BUCKET = os.getenv("S3_BUCKET")

session = boto3.Session(
    aws_access_key_id=os.getenv("aws_access_key_id"),
    aws_secret_access_key=os.getenv("aws_secret_access_key"),
    aws_session_token=os.getenv("aws_session_token"),
    region_name=AWS_REGION
)

dynamodb = session.resource('dynamodb')
s3 = session.client('s3')

def create_table_if_not_exists(table_name, key_schema, attribute_definitions):
    try:
        table = dynamodb.create_table(
            TableName=table_name,
            KeySchema=key_schema,
            AttributeDefinitions=attribute_definitions,
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"Creating table {table_name}...")
        table.wait_until_exists()
        print(f"Table {table_name} created successfully!")
        return table
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print(f"Table {table_name} already exists.")
            return dynamodb.Table(table_name)
        else:
            print(f"Error creating table {table_name}: {e}")
            raise

posts_table = create_table_if_not_exists(
    "Posts", # Table for Blog Posts
    [{'AttributeName': 'post_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'post_id', 'AttributeType': 'S'}]
)

users_table = create_table_if_not_exists(
    "Users", # Table for User credentials
    [{'AttributeName': 'user_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'user_id', 'AttributeType': 'S'}]
)

requests_table = create_table_if_not_exists(
    "Requests", # Table for User Requests
    [{'AttributeName': 'request_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'request_id', 'AttributeType': 'S'}]
)

notifications_table = create_table_if_not_exists(
    "FloodNotifications", # Table for Flood Notifications
    [{'AttributeName': 'notification_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'notification_id', 'AttributeType': 'S'}]
)

announcements_table = create_table_if_not_exists(
    "GlobalAnnouncements", # Table for Global Announcements
    [{'AttributeName': 'announcement_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'announcement_id', 'AttributeType': 'S'}]
)
