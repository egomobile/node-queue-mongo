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

import crypto from "crypto";

export function isNil(val: unknown): val is null | typeof undefined {
    return val === null ||
        typeof val === "undefined";
}

export function v4(): string {
    const temp = Buffer.alloc(16);
    crypto.randomFillSync(temp);

    const hex = temp.toString("hex");

    // example: ddf87db8-f44a-4109-b904-f01e1c1a0e68
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
}
