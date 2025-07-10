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

posts_table = dynamodb.Table("Posts") # Table for Blog Posts - Ali
users_table = dynamodb.Table("Users") # Table for User credentials - Ahmed
requests_table = dynamodb.Table("Requests") # Table for User Requests - Abduzafar & Ali

# Admin Tables - TP070572
notifications_table = create_table_if_not_exists(
    "FloodNotifications",
    [{'AttributeName': 'notification_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'notification_id', 'AttributeType': 'S'}]
)

# Create EmergencyContacts table if it doesn't exist
contacts_table = create_table_if_not_exists(
    "EmergencyContacts",
    [{'AttributeName': 'contact_id', 'KeyType': 'HASH'}],
    [{'AttributeName': 'contact_id', 'AttributeType': 'S'}]
)
