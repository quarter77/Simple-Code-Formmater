import js_beautify from 'js-beautify';

let options = {
    indent_size: 4,
    space_in_empty_paren: true,
    indent_char: ' ',
};

// C/C++ primitive and common types
const C_TYPES = new Set([
    'int', 'char', 'short', 'long', 'float', 'double', 'void', 'bool',
    'unsigned', 'signed', 'const', 'volatile', 'static', 'extern',
    'struct', 'union', 'enum', 'typedef', 'auto', 'register', 'inline',
    'size_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t',
    'int8_t', 'int16_t', 'int32_t', 'int64_t', 'ptrdiff_t',
    'wchar_t', 'string', 'vector', 'map', 'set', 'list',
]);

// Keywords that are always followed by a unary * or &
const UNARY_KEYWORDS = new Set([
    'return', 'sizeof', 'typeof', 'alignof', 'new', 'delete',
    'if', 'while', 'for', 'switch', 'case', 'else',
]);

function isTypeLike(token) {
    return C_TYPES.has(token) || /^[A-Z]/.test(token) || /_t$/.test(token);
}

// js-beautify treats * and & as binary operators and adds spaces on both sides.
// This post-processor restores correct C/C++ pointer/reference/dereference/address-of spacing.
function fixPointerSpacing(code) {
    return code.split('\n').map(line => {
        let i = 0;
        let out = '';
        while (i < line.length) {
            if (line[i] !== '*' && line[i] !== '&') {
                out += line[i++];
                continue;
            }

            // Find the previous non-whitespace character
            let prev = '';
            for (let j = out.length - 1; j >= 0; j--) {
                if (out[j] !== ' ' && out[j] !== '\t') { prev = out[j]; break; }
            }

            // Find the previous complete identifier token
            let prevToken = '';
            let k = out.trimEnd().length - 1;
            while (k >= 0 && /[a-zA-Z0-9_]/.test(out[k])) {
                prevToken = out[k--] + prevToken;
            }

            // && is always a binary logical op — output both chars and move on
            if (line[i] === '&' && line[i + 1] === '&') { out += '&&'; i += 2; continue; }

            // Collect consecutive * and & (js-beautify may have inserted spaces between them)
            let ops = line[i];
            let j = i + 1;
            while (j < line.length && (line[j] === '*' || line[j] === '&' || line[j] === ' ')) {
                if (line[j] === '*' || line[j] === '&') ops += line[j];
                j++;
            }

            // Determine if this is a unary operator (pointer/dereference/address-of):
            //   - line start, after punctuation/operators, after type keywords, after * or &
            const isUnary =
                prev === '' ||
                '(,=;{[!~+-'.includes(prev) ||
                prev === '*' || prev === '&' ||
                UNARY_KEYWORDS.has(prevToken) ||
                isTypeLike(prevToken);

            if (isUnary) {
                // Attach operator directly to the right-hand operand; keep left spacing intact
                out += ops;
                i = j;
            } else {
                // Binary operator — leave as-is
                out += line[i++];
            }
        }
        return out;
    }).join('\n');
}

export default function formatCode(code) {
    let result = js_beautify(code, options);
    // js-beautify splits -> into "p - > next" — restore to "p->next"
    result = result.replace(/ - > /g, '->');
    result = result.replace(/- >/g, '->');
    // js-beautify may break "const int *const" across lines — rejoin
    result = result.replace(/\*\n\s+(const|volatile)\b/g, '*$1');
    result = fixPointerSpacing(result);
    return result;
}
