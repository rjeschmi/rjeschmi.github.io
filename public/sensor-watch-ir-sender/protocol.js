/**
 * IR Time Sync Protocol
 *
 * Frame format:
 *   [preamble: 8 alternating bits] [start: 1,1] [data: 48 bits] [checksum: 8 bits]
 *
 * Data bytes (6 bytes, each sent LSB first):
 *   byte 0: year - 2020 (0-255)
 *   byte 1: month (1-12)
 *   byte 2: day (1-31)
 *   byte 3: hour (0-23)
 *   byte 4: minute (0-59)
 *   byte 5: second (0-59)
 *
 * Checksum: sum of all 6 data bytes, mod 256
 *
 * Encoding: OOK (on-off keying)
 *   1 = screen white (light)
 *   0 = screen black (dark)
 *   Fixed bit period (default 125ms)
 */

const IR_PROTOCOL = {
    PREAMBLE_BITS: 8,
    START_MARKER: [1, 1],
    DATA_BYTES: 6,
    YEAR_OFFSET: 2020,

    /**
     * Encode a Date into the protocol frame as an array of 0s and 1s.
     */
    encode(date) {
        const dataBytes = [
            date.getFullYear() - this.YEAR_OFFSET,
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
        ];

        const checksum = dataBytes.reduce((sum, b) => (sum + b) & 0xFF, 0);

        const frame = [];

        // Preamble: alternating 1,0,1,0,...
        for (let i = 0; i < this.PREAMBLE_BITS; i++) {
            frame.push(i % 2 === 0 ? 1 : 0);
        }

        // Start marker
        frame.push(...this.START_MARKER);

        // Data bytes, LSB first
        for (const byte of dataBytes) {
            for (let bit = 0; bit < 8; bit++) {
                frame.push((byte >> bit) & 1);
            }
        }

        // Checksum byte, LSB first
        for (let bit = 0; bit < 8; bit++) {
            frame.push((checksum >> bit) & 1);
        }

        return { frame, dataBytes, checksum };
    },

    /**
     * Total frame length in bits.
     */
    get frameLength() {
        return this.PREAMBLE_BITS + this.START_MARKER.length + (this.DATA_BYTES + 1) * 8;
    },

    /**
     * Estimated transmission time in milliseconds.
     */
    estimateTime(bitPeriodMs) {
        return this.frameLength * bitPeriodMs;
    },
};
