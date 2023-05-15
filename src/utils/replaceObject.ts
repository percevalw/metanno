
export const replaceObject = (obj: object, new_obj: object) => {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    })
    Object.assign(obj, new_obj);
}
