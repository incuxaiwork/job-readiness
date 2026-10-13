import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
import editorWorker from '../../node_modules/monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from '../../node_modules/monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from '../../node_modules/monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from '../../node_modules/monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from '../../node_modules/monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_workerId, label) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });
