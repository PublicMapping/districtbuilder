import { createAction } from "typesafe-actions";

export const toggleKeyboardShortcutsModal = createAction("Show keyboard shortcuts modal")();

export const showAdvancedEditingModal = createAction("Show advanced editing warning modal")<
  boolean
>();
export const showCopyMapModal = createAction("Show copy map modal")<boolean>();
export const showConvertMapModal = createAction("Show convert map modal")<boolean>();
export const setImportFlagsModal = createAction("Show import flags modal")<boolean>();
