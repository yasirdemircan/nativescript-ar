import * as application from "tns-core-modules/application";
import { ImageSource } from "tns-core-modules/image-source";
import * as utils from "tns-core-modules/utils/utils";
import { AR as ARBase, ARAddBoxOptions, ARAddImageOptions, ARAddModelOptions, ARAddOptions, ARAddPlaneOptions, ARAddSphereOptions, ARAddTextOptions, ARAddTubeOptions, ARAddVideoOptions, ARCommonNode, ARDebugLevel, ARLoadedEventData, ARPlaneTappedEventData, ARTrackingMode, ARUIViewOptions, ARVideoNode } from "./ar-common";
import { ARBox } from "./nodes/android/arbox";
import { ARGroup } from "./nodes/android/argroup";
import { ARImage } from "./nodes/android/arimage";
import { ARModel } from "./nodes/android/armodel";
import { ARPlane } from "./nodes/android/arplane";
import { ARSphere } from "./nodes/android/arsphere";
import { ARTube } from "./nodes/android/artube";
import { ARUIView } from "./nodes/android/aruiview";
import { ARVideo } from "./nodes/android/arvideo";
import { FragmentScreenGrab } from "./screengrab-android";
import { VideoRecorder } from "./videorecorder.android";

declare const com, android, global, java: any;

let _fragment, _origin, _videoRecorder;

const AppPackageName = useAndroidX() ? global.androidx.core.app : android.support.v4.app;
const ContentPackageName = useAndroidX() ? global.androidx.core.content : android.support.v4.content;

function useAndroidX() {
  return global.androidx && global.androidx.appcompat;
}

const addNode = (options: ARAddOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARCommonNode> => {
  return new Promise((resolve, reject) => {
    ARGroup.create(options, _fragment)
        .then((group: ARGroup) => {
          group.android.setParent(parentNode);
          resolve(group);
        }).catch(reject);
  });
};

const addVideo = (options: ARAddVideoOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARVideoNode> => {
  return new Promise<ARVideoNode>((resolve, reject) => {
    ARVideo.create(options, _fragment)
        .then((video: ARVideoNode) => {
          video.android.setParent(parentNode);
          resolve(video);
        }).catch(reject);
  });
};

const addImage = (options: ARAddImageOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARImage> => {
  return new Promise((resolve, reject) => {
    ARImage.create(options, _fragment)
        .then((image: ARImage) => {
          image.android.setParent(parentNode);
          resolve(image);
        }).catch(reject);
  });
};

const addPlane = (options: ARAddPlaneOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARPlane> => {
  return new Promise((resolve, reject) => {
    ARPlane.create(options, _fragment)
        .then((model: ARModel) => {
          model.android.setParent(parentNode);
          resolve(model);
        }).catch(reject);
  });
};

const addModel = (options: ARAddModelOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARModel> => {
  return new Promise((resolve, reject) => {
    ARModel.create(options, _fragment)
        .then((model: ARModel) => {
          model.android.setParent(parentNode);
          resolve(model);
        }).catch(reject);
  });
};

const addBox = (options: ARAddBoxOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARBox> => {
  return new Promise((resolve, reject) => {
    ARBox.create(options, _fragment)
        .then((box: ARBox) => {
          box.android.setParent(parentNode);
          resolve(box);
        }).catch(reject);
  });
};

const addSphere = (options: ARAddSphereOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARSphere> => {
  return new Promise((resolve, reject) => {
    ARSphere.create(options, _fragment)
        .then((sphere: ARSphere) => {
          sphere.android.setParent(parentNode);
          resolve(sphere);
        }).catch(reject);
  });
};

const addUIView = (options: ARUIViewOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARUIView> => {
  return new Promise((resolve, reject) => {
    ARUIView.create(options, _fragment)
        .then((view: ARUIView) => {
          view.android.setParent(parentNode);
          resolve(view);
        }).catch(reject);
  });
};

const addTube = (options: ARAddTubeOptions, parentNode: com.google.ar.sceneform.Node): Promise<ARTube> => {
  return new Promise((resolve, reject) => {
    ARTube.create(options, _fragment)
        .then((tube: ARTube) => {
          tube.android.setParent(parentNode);
          resolve(tube);
        }).catch(reject);
  });
};

const resolveParentNode = (options: ARAddOptions) => {
  if (options.parentNode && options.parentNode.android) {
    return options.parentNode.android;
  }
  return getOriginAnchor();
};

const getOriginAnchor = () => {
  if (!_origin) {
    const session = _fragment.getArSceneView().getSession();
    const pose = com.google.ar.core.Pose.IDENTITY;
    const anchor = session.createAnchor(pose);
    const anchorNode = new com.google.ar.sceneform.AnchorNode(anchor);
    anchorNode.setParent(_fragment.getArSceneView().getScene());
    _origin = anchorNode;
  }
  return _origin;
};


class TNSArFragmentForFaceDetection extends com.google.ar.sceneform.ux.ArFragment {

  constructor() {
    super();
    // necessary when extending TypeScript constructors
    return global.__native(this);
  }

  getSessionConfiguration(session) {
    const config = new com.google.ar.core.Config(session);
    config.setAugmentedFaceMode(com.google.ar.core.Config.AugmentedFaceMode.MESH3D);
    return config;
  }

  getSessionFeatures() {
    return java.util.EnumSet.of(com.google.ar.core.Session.Feature.FRONT_CAMERA);
  }

  onCreateView(inflater, container, savedInstanceState) {
    const frameLayout = super.onCreateView(inflater, container, savedInstanceState);
    super.getPlaneDiscoveryController().hide();
    super.getPlaneDiscoveryController().setInstructionView(null);
    return frameLayout;
  }
}

export class AR extends ARBase {
  private faceNodeMap = new Map();

  initNativeView(): void {
    super.initNativeView();

    // the SceneForm fragment sometimes fails to request camera permission, so we do it ourselves
    // const permission = android.Manifest.permission.CAMERA;
    // if (!this.wasPermissionGranted(permission)) {
    //   setTimeout(() => {
    //     this._requestPermission(permission, this.initAR);
    //   }, 2000);
    // } else {
    this.initAR();
    // }
  }

  private initAR() {
    this.nativeView.setId(android.view.View.generateViewId());

    if (this.trackingMode === ARTrackingMode.FACE) {
      _fragment = new TNSArFragmentForFaceDetection();

      // TODO for now this is a fixed face mesh, but of course we want to pass this stuff in
      let foxFaceRenderable: com.google.ar.sceneform.rendering.ModelRenderable;
      let foxFaceMeshTexture: com.google.ar.sceneform.rendering.Texture;

      com.google.ar.sceneform.rendering.ModelRenderable.builder()
          .setSource(utils.ad.getApplicationContext(), android.net.Uri.parse("fox_face.sfb"))
          .build()
          .thenAccept(new java.util.function.Consumer({
            accept: renderable => {
              foxFaceRenderable = renderable;
              foxFaceRenderable.setShadowCaster(false);
              foxFaceRenderable.setShadowReceiver(false);
            }
          }))
          .exceptionally(new java.util.function.Function({
            apply: error => console.error(error)
          }));


      // Load the face mesh texture.
      com.google.ar.sceneform.rendering.Texture.builder()
          .setSource(utils.ad.getApplicationContext(), android.net.Uri.parse("fox_face_mesh_texture.png"))
          .build()
          .thenAccept(new java.util.function.Consumer({
            accept: texture => foxFaceMeshTexture = texture
          }))
          .exceptionally(new java.util.function.Function({
            apply: error => console.error(error)
          }));

      setTimeout(() => {
        const sceneView = _fragment.getArSceneView();
        // This is important to make sure that the camera stream renders first so that the face mesh occlusion works correctly.
        sceneView.setCameraStreamRenderPriority(com.google.ar.sceneform.rendering.Renderable.RENDER_PRIORITY_FIRST);
        const scene = sceneView.getScene();

        scene.addOnUpdateListener(new com.google.ar.sceneform.Scene.OnUpdateListener({
          onUpdate: frameTime => {
            if (!foxFaceRenderable || !foxFaceMeshTexture) {
              return;
            }

            const faceList = sceneView.getSession().getAllTrackables(com.google.ar.core.AugmentedFace.class);

            // create AugmentedFaceNodes for any new faces
            for (let i = 0; i < faceList.size(); i++) {
              const face = faceList.get(i);
              if (!this.faceNodeMap.has(face)) {
                const faceNode = new com.google.ar.sceneform.ux.AugmentedFaceNode(face);
                faceNode.setParent(scene);
                faceNode.setFaceRegionsRenderable(foxFaceRenderable);
                // note that (at least in this case) the texture doesn't seem to make a difference
                faceNode.setFaceMeshTexture(foxFaceMeshTexture);
                this.faceNodeMap.set(face, faceNode);
              }
            }


            // Remove any AugmentedFaceNodes associated with an AugmentedFace that stopped tracking.
            this.faceNodeMap.forEach((node: any, face: any) => {
              if (face.getTrackingState() === com.google.ar.core.TrackingState.STOPPED) {
                node.setParent(null);
                this.faceNodeMap.delete(node);
              }
            });
          }
        }));
      }, 0);

    } else {
      _fragment = new com.google.ar.sceneform.ux.ArFragment();
      if (this.trackingMode === ARTrackingMode.IMAGE) {
      }
    }

    setTimeout(() => {
      const supportFragmentManager = (application.android.foregroundActivity || application.android.startActivity).getSupportFragmentManager();
      supportFragmentManager.beginTransaction().add(this.nativeView.getId(), _fragment).commit();

      // no need for these - the fragment will manage session suspending etc.. unless we get crashes which are not caused by livesync..
      // application.android.on(application.AndroidApplication.activityResumedEvent, (args: any) => {
      // });
      // application.android.on(application.AndroidApplication.activityPausedEvent, (args: any) => {
      // });

      _fragment.setOnTapArPlaneListener(new com.google.ar.sceneform.ux.BaseArFragment.OnTapArPlaneListener({
        onTapPlane: (hitResult, plane, motionEvent) => {
          const eventData: ARPlaneTappedEventData = {
            eventName: ARBase.planeTappedEvent,
            object: this,
            position: {
              x: hitResult.getHitPose().tx(),
              y: hitResult.getHitPose().ty(),
              z: hitResult.getHitPose().tz()
            }
          };
          this.notify(eventData);
        }
      }));

      // don't fire the event now, because that's too early.. but there doesn't seem to be an event we can listen to, so using our own impl here
      this.fireArLoadedEvent(1000);


      // TODO below is a bunch of experiments that need to be transformed in decent code (but they mostly work)

      // const context = application.android.context;
      // const resourcestmp = context.getResources();
      // const ident = resourcestmp.getIdentifier("andy", "raw", context.getPackageName());

      /* this model-loading approach also works
      let earthRenderable: com.google.ar.sceneform.rendering.ModelRenderable;
      const earthStage =
          com.google.ar.sceneform.rendering.ModelRenderable.builder()
              .setSource(utils.ad.getApplicationContext(), android.net.Uri.parse("Earth.sfb"))
              .build();

      java.util.concurrent.CompletableFuture
          .allOf([earthStage])
          .handle(new java.util.function.BiFunction({
            apply: (notUsed, throwable) => {
              console.log(">> handled! throwable: " + throwable);
              try {
                earthRenderable = earthStage.get();
              } catch (e) {
                console.log(e);
              }
            }
          }));
      */
    }, 0);
  }


  private fireArLoadedEvent(attemptsLeft: number): void {
    if (attemptsLeft-- <= 0) {
      return;
    }

    setTimeout(() => {
      if (_fragment.getArSceneView() &&
          _fragment.getArSceneView().getSession() &&
          _fragment.getArSceneView().getArFrame() &&
          _fragment.getArSceneView().getArFrame().getCamera() &&
          _fragment.getArSceneView().getArFrame().getCamera().getTrackingState() === com.google.ar.core.TrackingState.TRACKING) {

        const eventData: ARLoadedEventData = {
          eventName: ARBase.arLoadedEvent,
          object: this,
          android: _fragment
        };
        this.notify(eventData);
      } else {
        this.fireArLoadedEvent(attemptsLeft);
      }
    }, 300);
  }


  // TODO see sceneform example
  static isSupported(): boolean {
    return true;
    // can't use this before the ARCore lib is downloaded 🤔
    /*
    const availability = com.google.ar.core.ArCoreApk.getInstance().checkAvailability(utils.ad.getApplicationContext(), !AR.installRequested);
    if (availability.isTransient()) {
      console.log(">>> transient availability");
      // see https://developers.google.com/ar/develop/java/enable-arcore
    }
    return availability.isSupported();
    */
  }


  getFragment() {
    return _fragment;
  }

  get android(): any {
    return this.nativeView;
  }

  togglePlaneVisibility(on: boolean): void {
    console.log(">> togglePlaneVisibility: " + on);
    // this.renderer.setDrawPlanes(on); // TODO
  }

  togglePlaneDetection(on: boolean): void {
    // TODO this is just 'faking it' for now (by calling togglePlaneVisibility)
    console.log(">> togglePlaneDetection: " + on);
    this.togglePlaneVisibility(on);
  }

  toggleStatistics(on: boolean): void {
    console.log("Method not implemented: toggleStatistics");
  }

  setDebugLevel(to: ARDebugLevel): void {
    // const drawPlanesAndPointClound = to === ARDebugLevel.FEATURE_POINTS || to === ARDebugLevel.PHYSICS_SHAPES;
    // console.log(">> drawPlanesAndPointClound: " + drawPlanesAndPointClound);
    // this.renderer.setDrawPointCloud(drawPlanesAndPointClound);
    // this.renderer.setDrawPlanes(drawPlanesAndPointClound);
  }

  public grabScreenshot(): Promise<ImageSource> {
    return (new FragmentScreenGrab()).grabScreenshot(_fragment);
  }

  public startRecordingVideo(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!_videoRecorder) {
        _videoRecorder = VideoRecorder.fromFragment(_fragment);
      } else if (_videoRecorder.isRecording()) {
        reject("already recording");
        return;
      }

      const record = () => {
        _videoRecorder.setVideoQualityAuto();
        _videoRecorder.startRecordingVideo();
      };

      const permission = android.Manifest.permission.WRITE_EXTERNAL_STORAGE;
      if (!this.wasPermissionGranted(permission)) {
        // note that this will reset the AR experience, so perhaps better to request this permission up front instead
        this._requestPermission(permission, record, reject);
        return;
      }

      record();

      resolve(true);
    });
  }

  public stopRecordingVideo(): Promise<string> {
    return new Promise((resolve, reject) => {

      if (!(_videoRecorder && _videoRecorder.isRecording())) {
        reject("not recording");
      }

      _videoRecorder.stopRecordingVideo();
      resolve(_videoRecorder.getVideoPath());

    });
  }

  reset(): void {
    console.log("Method not implemented: reset");
    return null;
  }

  addNode(options: ARAddOptions): Promise<ARCommonNode> {
    return addNode(options, resolveParentNode(options));
  }

  addVideo(options: ARAddVideoOptions): Promise<ARVideoNode> {
    return addVideo(options, resolveParentNode(options));
  }

  addImage(options: ARAddImageOptions): Promise<ARCommonNode> {
    return addImage(options, resolveParentNode(options));
  }

  addModel(options: ARAddModelOptions): Promise<ARCommonNode> {
    return addModel(options, resolveParentNode(options));
  }

  addPlane(options: ARAddPlaneOptions): Promise<ARCommonNode> {
    return addPlane(options, resolveParentNode(options));
  }

  addBox(options: ARAddBoxOptions): Promise<ARCommonNode> {
    return addBox(options, resolveParentNode(options));
  }

  addSphere(options: ARAddSphereOptions): Promise<ARCommonNode> {
    return addSphere(options, resolveParentNode(options));
  }

  addText(options: ARAddTextOptions): Promise<ARCommonNode> {
    return new Promise((resolve, reject) => {
      reject("Method not implemented: addText");
    });
  }

  addTube(options: ARAddTubeOptions): Promise<ARCommonNode> {
    return addTube(options, resolveParentNode(options));
  }

  addUIView(options: ARUIViewOptions): Promise<ARCommonNode> {
    return addUIView(options, resolveParentNode(options));
  }

  private wasPermissionGranted(permission: string): boolean {
    let hasPermission = android.os.Build.VERSION.SDK_INT < 23; // Android M. (6.0)
    if (!hasPermission) {
      hasPermission = android.content.pm.PackageManager.PERMISSION_GRANTED ===
          ContentPackageName.ContextCompat.checkSelfPermission(
              utils.ad.getApplicationContext(),
              permission);
    }
    return hasPermission;
  }

  private _requestPermission(permission: string, onPermissionGranted: Function, reject?): void {
    console.log(">> requesting permission");
    const permissionRequestCode = 678; // random-ish id

    const onPermissionEvent = (args: any) => {
      if (args.requestCode === permissionRequestCode) {
        for (let i = 0; i < args.permissions.length; i++) {
          if (args.grantResults[i] === android.content.pm.PackageManager.PERMISSION_DENIED) {
            application.off(application.AndroidApplication.activityRequestPermissionsEvent, onPermissionEvent);
            reject && reject("Please allow access to external storage and try again.");
            return;
          }
        }
        application.off(application.AndroidApplication.activityRequestPermissionsEvent, onPermissionEvent);
        onPermissionGranted();
      }
    };

    application.android.on(application.AndroidApplication.activityRequestPermissionsEvent, onPermissionEvent);

    AppPackageName.ActivityCompat.requestPermissions(
        application.android.foregroundActivity || application.android.startActivity,
        [permission],
        permissionRequestCode
    );
  }

}
