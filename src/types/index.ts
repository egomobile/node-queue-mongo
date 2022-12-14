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

import type { QueueTaskData } from "@egomobile/queue";
import type { Collection as MongoCollection, ObjectId as MongoObjectId } from "mongodb";
import type { Nilable, Nullable } from "./internal";

/**
 * A logger.
 */
export interface ILogger {
    /**
     * Write DEBUG message.
     */
    debug?: Nilable<LogAction>;
    /**
     * Write ERROR message.
     */
    error?: Nilable<LogAction>;
    /**
     * Write INFO message.
     */
    info?: Nilable<LogAction>;
    /**
     * Write TRACE message.
     */
    trace?: Nilable<LogAction>;
    /**
     * Write WARN message.
     */
    // eslint-disable-next-line id-blacklist
    warn?: Nilable<LogAction>;
}

/**
 * A document in a MongoDb collection for a queue task.
 */
export interface IMongoQueueTaskDocument {
    /**
     * The Mongo ID
     */
    _id: MongoObjectId;
    /**
     * The timestamp, document has been created.
     */
    createdAt: Date;
    /**
     * A string indicating, which system / process / pod created the entry.
     */
    createdBy?: string;
    /**
     * The current data.
     */
    data: QueueTaskData;
    /**
     * List of occured errors.
     */
    errors: IMongoQueueTaskError[];
    /**
     * The key of the task.
     */
    key: string;
    /**
     * The status.
     */
    status: MongoQueueTaskStatus;
    /**
     * The timestamp, document has been updated.
     */
    updatedAt?: Date;
    /**
     * A string indicating, which system / process / pod updated the entry.
     */
    updatedBy?: string;
    /**
     * The UUID.
     */
    uuid: string;
}

/**
 * An entry for ``.
 */
export interface IMongoQueueTaskError {
    /**
     * Detailed information.
     */
    details: Nullable<string>;
    /**
     * (Short) Message.
     */
    message: Nullable<string>;
    /**
     * Name / type of the error.
     */
    name: Nullable<string>;
    /**
     * A string indicating, in which system / process / pod the error occurred.
     */
    occurredIn?: string;
    /**
     * Stack trace.
     */
    stack: Nullable<string>;
    /**
     * The timestamp.
     */
    time: Date;
}

/**
 * A log action.s
 */
export type LogAction = (...args: any[]) => any;

/**
 * The structure of a `setImmediate` compatible function.
 */
export type SetImmediateFunc = (action: (...args: any[]) => void, ...args: any[]) => NodeJS.Immediate;

/**
 * The structure of a `setTimeout` compatible function.
 */
export type SetTimeoutFunc = (action: (...args: any[]) => void, ms?: number, ...args: any[]) => NodeJS.Timeout;

/**
 * Possible values for a MongoDb based queue task.
 */
export enum MongoQueueTaskStatus {
    /**
     * cancelled
     */
    Cancelled = "cancelled",
    /**
     * just created
     */
    Created = "created",
    /**
     * failed
     */
    Failed = "failed",
    /**
     * running
     */
    Running = "running",
    /**
     * stopped
     */
    Stopped = "stopped",
    /**
     * run without problems
     */
    Success = "success",
}

/**
 * Action for a function / method that works with a Mongo collection
 * storing `IMongoQueueTaskDocument` documents.
 *
 * @param {MongoCollection<IMongoQueueTaskDocument>} collection The underlying collection.
 *
 * @returns {PromiseLike<TResult>} The promise with the result of the action.
 */
export type WithTaskCollectionAction<TResult = any> = (
    collection: MongoCollection<IMongoQueueTaskDocument>
) => PromiseLike<TResult>;
