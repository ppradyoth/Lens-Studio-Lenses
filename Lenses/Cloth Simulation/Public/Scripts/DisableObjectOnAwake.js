// DisableObjectOnAwake.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Disable Object On Awake

//@input SceneObject objectToDisable

if (!script.objectToDisable) {
    print("ERROR: ObjectToHide is not set");
    return;
}

script.objectToDisable.enabled = false;
