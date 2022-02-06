// HandSkeletonController.js
// Version: 0.0.1
// Event: Lens Initialized
// Description: Adds a pair of skeleton to 3D Hand Tracking

//@input Component.ObjectTracking3D handTracking
//@input bool showJoints
//@input SceneObject jointIndicator {"showIf":"showJoints"}
//@input int colorMode = 0 {"showIf":"showJoints","widget":"combobox","values":[{"value":"0","label":"Uniformed"},{"value":"1","label":"By Finger"},{"value":"2","label":"By Roots"}]}
//@input bool showBones
//@input SceneObject fingerBoneIndicator {"showIf":"showBones"}
//@input SceneObject palmBoneIndicator {"showIf":"showBones"}

const JOINT_NAMES = ["wrist","thumb-0","thumb-1","thumb-2","thumb-3","index-0","index-1","index-2","index-3","mid-0","mid-1","mid-2","mid-3","ring-0","ring-1","ring-2","ring-3","pinky-0","pinky-1","pinky-2","pinky-3","wrist_to_thumb","wrist_to_index","wrist_to_mid","wrist_to_ring","wrist_to_pinky"];
const JOINT_NAME_BY_FINGER = ["wrist", "thumb", "index", "mid", "ring", "pinky"];
const JOINT_NAME_BY_ROOT = ["to", "0", "1", "2", "3", "wrist"];
const BONE_SCALE_LENGTH = 0.1;

var joints = {};
var bones = [];

var isHandTracking = false;


function initialize() {
    for (var i=0;i<JOINT_NAMES.length;i++) {
        joints[JOINT_NAMES[i]] = new Joint(JOINT_NAMES[i]);
    }
    
    for (var k in joints) {

        if (!joints[k].object) {
            return;
        }
        
        var connectedJ = null;
        if (joints[k].name.includes("wrist_to")) {
            var connectedJName = joints[k].name.replace("wrist_to_","") + "-0";
            connectedJ = getJoint(connectedJName);
        } else if (joints[k].name.includes("-") && !joints[k].name.includes("3")) {
            var jointNameSplit = joints[k].name.split("-");
            var idx = parseInt(jointNameSplit[1]) + 1;
            connectedJ = getJoint(jointNameSplit[0] + "-" + idx.toString());
        }
        
        if (connectedJ) {
            bones.push(new Bone(joints[k], connectedJ));
        }

    }
    
    script.createEvent("UpdateEvent").bind(onUpdate);
}

initialize();


function Joint(jointName) {
    this.name = jointName;
    
    this.object = script.handTracking.createAttachmentPoint(jointName);

    if (this.object) {
        this.objectTransform = this.object.getTransform();
        this.position = this.objectTransform.getWorldPosition();
        this.rotation = this.objectTransform.getWorldRotation();
    }

    this.jointIndicator = null;
    if (!script.jointIndicator) {
        print("WARNING! Please input objects to Joint Indicators");
        return;
    }
    
    var jointNameInclude = [];

    if (script.colorMode == 1) {
        jointNameInclude = JOINT_NAME_BY_FINGER;
    } else if (script.colorMode == 2) {
        jointNameInclude = JOINT_NAME_BY_ROOT;
    }
    
    if (script.colorMode == 0) {
        this.jointIndicator = script.getSceneObject().copyWholeHierarchy(script.jointIndicator);
    } else {
        
        if (script.jointIndicator.getChildrenCount() < 6) {
            print("ERROR! Not Enough Children in the JointIndicator Object!");
        } else if (!this.name.includes("wrist_to")) {
            for (var i = 0; i < jointNameInclude.length; i++) {
                if (jointName.includes(jointNameInclude[i])) {
                    this.jointIndicator = script.getSceneObject().copyWholeHierarchy(script.jointIndicator.getChild(i));
                }
            }
        }
    }
    
    if (this.jointIndicator) {
        this.jointIndicatorTransform = this.jointIndicator.getTransform();
        this.jointIndicator.enabled = (script.showJoints && isHandTracking);
    }
}

Joint.prototype.update = function() {
    if (this.objectTransform) {
        this.position = this.objectTransform.getWorldPosition();
        this.rotation = this.objectTransform.getWorldRotation();
        var localRot = this.objectTransform.getLocalRotation().toEulerAngles().uniformScale(180 / Math.PI);
        localRot.x = localRot.x % 180;
        localRot.y = localRot.y % 180;
        localRot.z = localRot.z % 180;
        this.localRotation = localRot;
    }
    
    if (script.showJoints && isHandTracking) {
        if (this.jointIndicatorTransform) {
            this.jointIndicatorTransform.setWorldPosition(this.position);
            this.jointIndicatorTransform.setWorldRotation(this.rotation);
        }
    }
};

function Bone(jointA, jointB) {
    if (!jointA.object || !jointB.object) {
        return;
    }
    this.startJoint = jointA;
    this.endJoint = jointB;

    if (jointA.name.includes("wrist_to") && !jointA.name.includes("thumb")) {
        if (script.palmBoneIndicator) {
            this.object = script.getSceneObject().copyWholeHierarchy(script.palmBoneIndicator);
        }
    } else {
        if (script.fingerBoneIndicator) {
            this.object = script.getSceneObject().copyWholeHierarchy(script.fingerBoneIndicator);
        }
    }
    
    //this.object = script.getSceneObject().copyWholeHierarchy(script.fingerBoneIndicator);
    
    
    if (this.object) {
        this.objectTransform = this.object.getTransform();
        this.object.enabled = (script.showBones && isHandTracking);
    }
}

Bone.prototype.update = function() {
    if (!script.showBones || !isHandTracking) {
        return;
    }
    this.length = this.startJoint.position.distance(this.endJoint.position) * BONE_SCALE_LENGTH;
    if (this.objectTransform) {
        this.objectTransform.setLocalScale(new vec3(this.length, this.length, this.length));
        this.objectTransform.setWorldPosition(this.startJoint.position);
        var ang = rotateTowards(this.startJoint.position, this.endJoint.position, vec3.forward());
        if (ang.x) {
            this.objectTransform.setWorldRotation(ang);
        }
    }
    
};

function onUpdate() {
    for (var i in joints) {
        joints[i].update();
    }
    
    for (var j=0; j < bones.length;j++) {
        bones[j].update();
    }
}

function getJoint(jName) {
    return joints[jName];
}
function rotateTowards(org, target, direction) {
    var dir = org.sub(target);
    return quat.lookAt(dir, direction);
}

script.handTracking.onTrackingStarted = function() {
    toggleVisual(true);
};

script.handTracking.onTrackingLost = function() {
    toggleVisual(false);
};

function toggleVisual(isVisible) {

    isHandTracking = isVisible;
    
    for (var i in joints) {
        if (joints[i].jointIndicator) {
            joints[i].jointIndicator.enabled = (isVisible && script.showJoints);
        }
    }
    
    for (var j=0; j < bones.length;j++) {
        if (bones[j].object) {
            bones[j].object.enabled = (isVisible && script.showBones);
        }
    }
}
