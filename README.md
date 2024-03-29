[![npm](https://img.shields.io/npm/v/@egomobile/queue-mongo.svg)](https://www.npmjs.com/package/@egomobile/queue-mongo)
[![last build](https://img.shields.io/github/workflow/status/egomobile/node-queue-mongo/Publish)](https://github.com/egomobile/node-queue-mongo/actions?query=workflow%3APublish)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/egomobile/node-queue-mongo/pulls)

# @egomobile/queue-mongo

> Queue storage for [@egomobile/queue](https://github.com/egomobile/node-queue), using [MongoDB](https://en.wikipedia.org/wiki/MongoDB) as backend.

## Install

Execute the following command from your project folder, where your `package.json` file is stored:

```bash
npm install --save @egomobile/queue-mongo
```

## Usage

```typescript
import { Queue } from "@egomobile/queue";
import {
  IMongoQueueStorageOptions,
  MongoQueueStorage,
} from "@egomobile/queue-mongo";
import { MongoClient } from "mongodb";

let queue!: Queue;

async function main() {
  const url = process.env.MONGO_URL?.trim() || "mongodb://localhost:27017";
  const mongoClient = new MongoClient(url);
  const db = mongoClient.db("my_database");

  const storageOptions: IMongoQueueStorageOptions = {
    getDb: () => {
      return db;
    },
  };

  queue = new Queue({
    storageClass: MongoQueueStorage,
    storageClassArgs: [storageOptions],
  });

  // register 2 tasks at once
  queue.register({
    // 1st
    myTask1: async (context) => {
      console.log("This is task 1 with following data:", context.data);
    },

    // 2nd
    myTask2: async (context) => {
      console.log("This is task 2 with following data:", context.data);
    },
  });

  // anything is prepared, lets start the queue
  await queue.start();

  // first enqueue 2nd task
  await queue.enqueue("myTask2", {
    data: {
      buzz: 5979,
    },
  });
  // then 1st one
  await queue.enqueue("myTask1", {
    data: {
      foo: "bar",
    },
  });
}

main().catch(console.error);
```

## Documentation

The API documentation can be found [here](https://egomobile.github.io/node-queue-mongo/).
