'use strict';

var AWS = require("aws-sdk");
var sqs = new AWS.SQS({region: 'ap-northeast-2'});

var TASK_QUEUE_URL = 'xxxx';
var mysql = require('mysql');
var phoneNo = '';
var messageId = '';
var status = 0;

function work(task, cb) {
  console.log(task);
  console.log(task.Records[0].body);

  // var profile = task.Records[0].body.ResponseMetadata;
  console.log("HTTPStatusCode");
  var profile = JSON.parse(task.Records[0].body);
  console.log(profile);
  console.log(profile.ResponseMetadata);
  console.log(profile.ResponseMetadata.HTTPStatusCode);
  messageId = profile.MessageId;
  console.log("MessageId");
  console.log(messageId);

  if(profile.ResponseMetadata.HTTPStatusCode == 200){
    status = 1;
  } else {
    status = 0;
  }

  var jsonData = JSON.stringify(task.Records[0].messageAttributes);
  console.log(jsonData);
  var msg = JSON.parse(jsonData);
  console.log("phone_number");
  console.log(msg.phone_number.stringValue);
  phoneNo = msg.phone_number.stringValue;

  console.log("ReceiptHandlePrev");
  console.log(task.Records[0].receiptHandle);

  sqs.deleteMessage({
    ReceiptHandle: task.Records[0].receiptHandle,
    QueueUrl: TASK_QUEUE_URL
  });

  console.log("ReceiptHandleNext");
  cb();
}

exports.handler = function(event, context, callback) {
  work(event, function(err) {
    if (err) {
      callback(err);
    } else {
      var connection = mysql.createConnection({
          host     : 'xxx',
          user     : 'xxx',
          password : 'xxxx',
          port     : 3306,
          database : 'showprise'
      });

      connection.connect(function(error){
          if(error){
              console.log("Couldn't connect :( " + error);
          } else {
              console.log("Connected successfully~!");
          }
      });

      var resultSql = "INSERT INTO sms_result (message_id, phone_no, status, reg_date) VALUES (?,?,?, now())";
      var resultParams = [messageId, phoneNo, status];
      connection.query(resultSql, resultParams, function(err, rows, fields){
      	if(err){
      		console.log(err);
      	} else {
      		console.log(rows.insertId);
      	}
      });

      connection.end(function(err) {
        // The connection is terminated now
        if (err) {
          console.error('[connection.end]err: ' + err);
          connection.destroy()
          return;
        }
        console.log('connection ended');
      });

    }
  });
};
