// 引入代码格式化库
import js_beautify from 'js-beautify';
// 默认设置
let options = {
    indent_size: 4,
    space_in_empty_paren: true,
    indent_char: ' ',
};
// 格式化代码
export default function formatCode(code) {
    const result = js_beautify(code, options);
    // js-beautify treats -> as arithmetic operators and inserts a space; restore it
    return result.replace(/- >/g, '->');
}