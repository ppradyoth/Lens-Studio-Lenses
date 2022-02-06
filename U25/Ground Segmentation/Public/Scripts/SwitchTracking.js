// SwitchTracking.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Update ground tracking for Device Tracking when switching cameras.
//@input Component.DeviceTracking deviceTrackingComponent {"label":"Device Tracking"}
//@input bool Advanced
//@input SceneObject[] objDisableOnFallback{"hint":"list of objects to disable if device does not have gyro", "showIf":"Advanced", "showIfValue": true}

function onSwitchToFrontCamera() {
    script.deviceTrackingComponent.requestDeviceTrackingMode(DeviceTrackingMode.Rotation);
    script.getTransform().setWorldPosition(new vec3(0, 100, 0));
}

function onSwitchToBackCamera() {
    script.deviceTrackingComponent.requestDeviceTrackingMode(DeviceTrackingMode.Surface);
}

function onTurnOn() {
    for (var i=0;i<script.objDisableOnFallback.length;i++) {
        if (script.objDisableOnFallback[i]) {
            script.objDisableOnFallback[i].enabled = script.deviceTrackingComponent.isDeviceTrackingModeSupported(DeviceTrackingMode.Rotation);
        }
    }
}


script.createEvent("CameraFrontEvent").bind(onSwitchToFrontCamera);
script.createEvent("CameraBackEvent").bind(onSwitchToBackCamera);
script.createEvent("TurnOnEvent").bind(onTurnOn);
