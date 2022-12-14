// This file is part of the @egomobile/queue-mongo distribution.
// Copyright (c) Next.e.GO Mobile SE, Aachen, Germany (https://e-go-mobile.com/)
//
// @egomobile/queue-mongo is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as
// published by the Free Software Foundation, version 3.
//
// @egomobile/queue-mongo is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
// Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { IQueueTaskContext, IQueueTaskInStorageOptions, QueueStorageBase } from "@egomobile/queue";
import type { Db as MongoDb } from "mongodb";
import { ConsoleLogger } from "./ConsoleLogger";
import type { Nilable, Optional } from "../types/internal";
import { isNil, v4 } from "../utils/internal";
import { ILogger, IMongoQueueTaskDocument, IMongoQueueTaskError, MongoQueueTaskStatus, SetImmediateFunc, SetTimeoutFunc, WithTaskCollectionAction } from "../types";
import { defaultQueueTasksCollectionName, defaultWaitBeforeRetryTime } from "../constants";

interface IExecuteTaskOptions {
    task: IMongoQueueTaskDocument;
    timeToWait?: number;
}

/**
 * Options for a (new) `MongoQueueStorage` instance.
 */
export interface IMongoQueueStorageOptions {
    /**
     * A function, returning the Mongo database.
     *
     * @returns {MongoDb|PromiseLike<MongoDb>} The instance or the promise with it.
     */
    getDb: () => MongoDb | PromiseLike<MongoDb>;
    /**
     * A function, returning a custom logger.
     *
     * @returns {ILogger} The logger to ise.
     */
    getLogger?: Nilable<() => ILogger>;
    /**
     * A custom function, returning the name of the system.
     *
     * @returns {any} A value representing the name of the system.
     */
    getSystemName?: Nilable<() => any>;
    /**
     * Custom `setImmediate` function.
     */
    setImmediate?: Nilable<SetImmediateFunc>;
    /**
     * Custom `setTimeout` function.
     */
    setTimeout?: Nilable<SetTimeoutFunc>;
    /**
     * The custom name of the collection for the tasks. Default: `queueTasks`
     */
    taskCollectionName?: Nilable<string>;
    /**
     * The custom time in milliseconds to wait, before a failed task is done to be executed. Default: `10000`
     */
    waitBeforeRetry?: Nilable<number>;
}

/**
 * An `IQueueStorage` with MongoDB as backend.
 */
export class MongoQueueStorage extends QueueStorageBase {
    private readonly _taskCollectionName: string = defaultQueueTasksCollectionName;
    private readonly _waitBeforeRetry: number = defaultWaitBeforeRetryTime;

    /**
     * Initializes a new instance of that class.
     *
     * @param {IMongoQueueStorageOptions} options The options.
     */
    public constructor(options: IMongoQueueStorageOptions) {
        super();

        const { getDb, getLogger, getSystemName, taskCollectionName, waitBeforeRetry } = options;

        // options.getSystemName
        if (isNil(getSystemName)) {
            this.getSystemName = () => {
                return process.env.POD_NAME?.trim() ?? undefined;
            };
        }
        else {
            if (typeof getSystemName !== "function") {
                throw new TypeError("options.getSystemName must be of type function");
            }

            this.getSystemName = () => {
                return String(getSystemName() ?? "").trim() || "";
            };
        }

        //  options.getDb
        if (typeof getDb !== "function") {
            throw new TypeError("options.getDb must be of type function");
        }

        // options.setImmediate
        if (isNil(options.setImmediate)) {
            this.setImmediate = setImmediate;
        }
        else {
            if (typeof options.setImmediate !== "function") {
                throw new TypeError("options.setImmediate must be of type function");
            }

            this.setImmediate = options.setImmediate;
        }

        // options.setTimeout
        if (isNil(options.setTimeout)) {
            this.setTimeout = setTimeout;
        }
        else {
            if (typeof options.setTimeout !== "function") {
                throw new TypeError("options.setTimeout must be of type function");
            }

            this.setTimeout = options.setTimeout;
        }

        // options.getLogger
        if (isNil(getLogger)) {
            const logger = new ConsoleLogger();

            this.getLogger = () => {
                return logger;
            };
        }
        else {
            if (typeof getLogger !== "function") {
                throw new TypeError("options.getLogger must be of type function");
            }

            this.getLogger = getLogger;
        }

        // options.taskCollectionName
        if (!isNil(taskCollectionName)) {
            if (typeof taskCollectionName !== "string") {
                throw new TypeError("options.taskCollectionName must be of type string");
            }

            this._taskCollectionName = taskCollectionName;
        }

        // options.waitBeforeRetry
        if (!isNil(waitBeforeRetry)) {
            if (typeof waitBeforeRetry !== "number") {
                throw new TypeError("options.waitBeforeRetry must be of type number");
            }

            this._waitBeforeRetry = waitBeforeRetry;
        }

        // options.getDb
        this.getDb = () => {
            return Promise.resolve(getDb());
        };
    }

    /**
     * Creates an `IQueueTaskContext` from a mongo document.
     *
     * @param {IMongoQueueTaskDocument} doc The document.
     *
     * @returns {Promise<IQueueTaskContext>} The promise with the new instance.
     */
    protected async createContextFromDocument(doc: IMongoQueueTaskDocument): Promise<IQueueTaskContext> {
        return {
            "id": String(doc.uuid).toLowerCase().trim() || null
        };
    }

    /**
     * Returns the Mongo database to use.
     *
     * @returns {Promise<MongoDb>} The promise with the instance.
     */
    public readonly getDb: () => Promise<MongoDb>;

    /**
     * Returns the logger.
     *
     * @returns {ILogger} The logger.
     */
    public readonly getLogger: () => ILogger;

    /**
     * Returns the (normalized) system name.
     *
     * @returns {Optional<string>} The system name.
     */
    public readonly getSystemName: () => Optional<string>;

    /**
     * @inheritdoc
     */
    public enqueueRemainingTasks(): Promise<IQueueTaskContext[]> {
        return this.withTaskCollection(async (collection) => {
            const nonRunningTasks = await collection.find({
                "$and": [{
                    "status": { "$ne": MongoQueueTaskStatus.Success }
                }, {
                    "status": { "$ne": MongoQueueTaskStatus.Cancelled }
                }, {
                    "status": { "$ne": MongoQueueTaskStatus.Running }
                }]
            }).sort({
                "_id": 1
            }).toArray();

            const result: IQueueTaskContext[] = [];

            for (const doc of nonRunningTasks) {
                this.executeTask({
                    "task": doc
                });

                result.push(
                    await this.createContextFromDocument(doc)
                );
            }

            this.getLogger().info?.(
                "MongoQueueStorage.enqueueRemainingTasks()",
                `Requeued ${nonRunningTasks.length} tasks`,
            );

            return result;
        });
    }

    /**
     * @inheritdoc
     */
    public enqueueTask(options: IQueueTaskInStorageOptions): Promise<IQueueTaskContext> {
        const { data, key } = options;

        return this.withTaskCollection(async (collection) => {
            const newDoc: IMongoQueueTaskDocument = {
                "_id": undefined!,
                key,
                "uuid": v4(),
                "data": data ?? {},
                "createdAt": new Date(),
                "createdBy": this.getSystemName(),
                "status": MongoQueueTaskStatus.Created,
                "errors": []
            };

            const result = await collection.insertOne(newDoc);
            newDoc._id = result.insertedId;

            this.executeTask({
                "task": newDoc
            });

            this.getLogger().info?.(
                "MongoQueueStorage.enqueueTask()",
                `Task has been enqueued with ID ${newDoc._id}`,
            );

            return this.createContextFromDocument(newDoc);
        });
    }

    private executeTask(options: IExecuteTaskOptions) {
        const { task, timeToWait } = options;

        const executionHandlers = this.getExecutionHandlers();

        const updateTask = async (dataToUpdate: Partial<IMongoQueueTaskDocument>) => {
            const $set: Partial<IMongoQueueTaskDocument> = {
                "data": {
                    ...(task.data ?? {})
                },
                "updatedAt": new Date(),
                "updatedBy": this.getSystemName()
            };
            const $unset: Partial<Record<keyof IMongoQueueTaskDocument, 1>> = {};

            const entries = Object.entries(dataToUpdate) as [keyof IMongoQueueTaskDocument, any][];
            for (const [key, value] of entries) {
                if (typeof value === "undefined") {
                    $unset[key] = 1;
                }
                else {
                    $set[key] = value as any;
                }
            }

            await this.withTaskCollection(async (collection) => {
                await collection.updateOne({
                    "_id": task._id
                }, {
                    $set,
                    $unset
                });
            });

            this.getLogger().debug?.(
                "MongoQueueStorage.executeTask(updateTask)",
                `Task ${task._id} with key ${task.key} has been updated with status ${$set["status"] ?? task.status}`,
            );
        };

        const handleError = async (error: any) => {
            try {
                const errorMessage = String(error?.message).trim() || null;
                const errorDetails = String(error).trim() || null;
                const errorStack = String(error?.stack).trim() || null;
                const errorName = String(error?.name).trim() || null;

                const newErrorList: IMongoQueueTaskError[] = [
                    ...task.errors, {
                        "time": new Date(),
                        "name": errorName,
                        "message": errorMessage,
                        "stack": errorStack,
                        "details": errorDetails,
                        "occurredIn": this.getSystemName()
                    }
                ];

                // update task with new data
                await updateTask({
                    "status": MongoQueueTaskStatus.Failed,
                    "errors": newErrorList
                });

                task.status = MongoQueueTaskStatus.Failed;
                task.errors = newErrorList;

                // retry ...
                this.executeTask({
                    ...options,

                    "timeToWait": this._waitBeforeRetry ?? undefined
                });

                this.getLogger().warn?.(
                    "MongoQueueStorage.executeTask(handleError)",
                    `Task ${task._id} with key ${task.key} has been failed and will tried to be executed in ${this._waitBeforeRetry}ms again`,
                );
            }
            catch (error2: any) {
                this.getLogger().error?.("MongoQueueStorage.executeTask(handleError)", error, error2);
            }
        };

        const taskAction = async () => {
            try {
                await this.withTaskCollection(async (collection) => {
                    // mark as running
                    await updateTask({
                        "status": MongoQueueTaskStatus.Running
                    });

                    for (const handler of executionHandlers) {
                        const start = new Date();
                        await Promise.resolve(
                            handler({
                                "data": task.data,
                                "taskKey": task.key
                            })
                        );

                        const end = new Date();
                        const diff = end.valueOf() - start.valueOf();

                        this.getLogger().info?.(
                            "MongoQueueStorage.executeTask(taskAction)",
                            `Action for task ${task._id} with key ${task.key} has been executed after ${diff}ms`,
                        );
                    }

                    // mark as succeeded
                    await updateTask({
                        "status": MongoQueueTaskStatus.Success
                    });
                });
            }
            catch (error) {
                await handleError(error);
            }
        };

        if (typeof timeToWait === "number") {
            this.getLogger().info?.(
                "MongoQueueStorage.executeTask()",
                `Task ${task._id} with key ${task.key} will tried to be executed in ${timeToWait}ms`,
            );

            this.setTimeout(taskAction, timeToWait);
        }
        else {
            this.getLogger().info?.(
                "MongoQueueStorage.executeTask()",
                `Task ${task._id} with key ${task.key} will tried to be executed immediately`,
            );

            this.setImmediate(taskAction);
        }
    }

    /**
     * `setImmediate` function to use.
     */
    public readonly setImmediate: SetImmediateFunc;

    /**
     * `setTimeout` function to use.
     */
    public readonly setTimeout: SetTimeoutFunc;

    /**
     * @inheritdoc
     */
    public stopAllEnqueuedTasks(): Promise<any> {
        return this.withTaskCollection(async (collection) => {
            // update / stop all, which are not succeeded
            const updateResult = await collection.updateMany({
                "$and": [{
                    "status": { "$ne": MongoQueueTaskStatus.Success }
                }, {
                    "status": { "$ne": MongoQueueTaskStatus.Cancelled }
                }]
            }, {
                "$set": {
                    "status": MongoQueueTaskStatus.Stopped
                }
            });

            this.getLogger().debug?.(
                "MongoQueueStorage.stopAllEnqueuedTasks()",
                `Number of documents, which have been modified: ${String(updateResult.modifiedCount)}`,
            );
        });
    }

    /**
     * Execute an action for the task collection.
     *
     * @param {WithTaskCollectionAction<TResult>} action The action to invoke.
     *
     * @returns {Promise<TResult>} The promise with the result.
     */
    protected async withTaskCollection<TResult = any>(
        action: WithTaskCollectionAction<TResult>
    ): Promise<TResult> {
        const db = await this.getDb();
        const collection = db.collection<IMongoQueueTaskDocument>(this._taskCollectionName);

        return action(collection);
    }
}
