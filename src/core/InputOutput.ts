export async function onSave(): Promise<boolean> {
  console.log("onSave");
  return true;
}

export async function onSaveAs(): Promise<boolean> {
  console.log("onSaveAs");
  return true;
}

export async function onOpen(): Promise<boolean> {
  console.log("onOpen");
  return true;
}

export async function onNew(): Promise<boolean> {
  console.log("onNew");
  return true;
}

export async function onDropFile(file: File, saveCheck: boolean = true): Promise<boolean> {
  console.log(file);
  // file upload here
  return true;
}
