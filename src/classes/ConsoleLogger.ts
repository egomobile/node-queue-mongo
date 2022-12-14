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

import type { ILogger } from "../types";

/**
 * A console logger.
 */
export class ConsoleLogger implements ILogger {
    /**
     * @inheritdoc
     */
    public debug(...args: any[]): any {
        return console.debug(...args);
    }

    /**
     * @inheritdoc
     */
    public error(...args: any[]): any {
        return console.error(...args);
    }

    /**
     * @inheritdoc
     */
    public info(...args: any[]): any {
        return console.info(...args);
    }

    /**
     * @inheritdoc
     */
    public trace(...args: any[]): any {
        return console.trace(...args);
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line id-blacklist
    public warn(...args: any[]): any {
        return console.warn(...args);
    }
}
