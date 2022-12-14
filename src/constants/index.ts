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

/**
 * Default name for a collection inside a Mongo database
 * where tasks are managed.
 */
export const defaultQueueTasksCollectionName = "queueTasks";

/**
 * The default value in milliseconds, which is used to wait after
 * a failed task has to be retried.
 */
export const defaultWaitBeforeRetryTime = 10000;
