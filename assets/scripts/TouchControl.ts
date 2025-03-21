import { _decorator, Component, Node, EventTouch, Vec2, Vec3, math, input, Input, Camera, Quat } from 'cc';
const { ccclass, property, menu } = _decorator;

@ccclass('Touch3DControl')
// @menu('Tools/3D Touch Control')
export class Touch3DControl extends Component {

    @property(Node)
    targetNode: Node | null = null; // 要控制的 3D 模型节点

    @property(Camera)
    mainCamera: Camera | null = null; // 场景主摄像机（用于坐标转换）

    @property({ tooltip: "平移灵敏度" })
    panSensitivity: number = 0.5;

    @property({ tooltip: "缩放灵敏度" })
    zoomSensitivity: number = 0.005;

    @property({ tooltip: "旋转灵敏度" })
    rotateSensitivity: number = 0.3;

    @property({ tooltip: "最小缩放比例" })
    minScale: number = 0.3;

    @property({ tooltip: "最大缩放比例" })
    maxScale: number = 3.0;

    // 内部状态
    private _prevTouchCount: number = 0;
    private _prevDistance: number = 0; // 双指距离
    private _prevMidPoint: Vec2 | null = null; // 双指中点（屏幕坐标）
    private _prevRotation: Vec3 = new Vec3(); // 模型初始欧拉角

    onLoad() {
        // 绑定触摸事件
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        const touches = event.getTouches();
        console.log(touches.length,'0')
        if (touches.length === 1) {
          const pos1 = touches[0].getLocation();
          const pos2 = touches[0].getLocation();
          this._prevDistance = Vec2.distance(pos1, pos2);
          console.log('111')
          this._prevMidPoint = new Vec2((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
            // 单指：记录初始旋转角度
            // this._prevRotation = this.targetNode?.eulerAngles.clone() || new Vec3();
        } else if (touches.length === 2) {
            // 双指：记录初始距离和中点
            const pos1 = touches[0].getLocation();
            const pos2 = touches[1].getLocation();
            this._prevDistance = Vec2.distance(pos1, pos2);
            console.log('111')
            this._prevMidPoint = new Vec2((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
        }
    }

    onTouchMove(event: EventTouch) {
        if (!this.targetNode || !this.mainCamera) return;

        const touches = event.getTouches();
        const touchCount = touches.length;
        console.log(touchCount,'touchCount')

        // 单指旋转逻辑
        if (touchCount === 1) {
          this.handleTwoTouches(event);
          // this.handleSingleTouch(event);
        } 
        // 双指平移 + 缩放逻辑
        else if (touchCount === 2) {
            this.handleTwoTouches(event);
        }

        this._prevTouchCount = touchCount;
    }

    // 单指旋转（绕 Y 轴和 X 轴）
    private handleSingleTouch(event: EventTouch) {
      const touches = event.getTouches();
        const touch = touches[0];
        const delta = touch.getDelta();

        // 计算旋转角度（水平控制 Y 轴，垂直控制 X 轴）
        const rotation = this._prevRotation.clone();
        rotation.y += delta.x * this.rotateSensitivity; // Y 轴旋转
        rotation.x -= delta.y * this.rotateSensitivity; // X 轴旋转

        // 限制角度范围（可选）
        rotation.x = math.clamp(rotation.x, -60, 60);

        this.targetNode.setRotationFromEuler(rotation);
    }

    // 双指平移 + 缩放
    private handleTwoTouches(event: EventTouch) {
      const touches = event.getTouches();
        const touch1 = touches[0];
        const touch2 = touches[0];
        const pos1 = touch1.getLocation();
        const pos2 = touch2.getLocation();

        // ----------- 处理平移 -----------
        const currentMidPoint = new Vec2((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
        console.log(this._prevMidPoint,'this._prevMidPoint')
        if (this._prevMidPoint) {
            // 将屏幕坐标转换为世界坐标方向向量
            // const prevWorldPos = this.screenToWorldVector(this._prevMidPoint);
            // const currentWorldPos = this.screenToWorldVector(currentMidPoint);
            const prevWorldPos = new Vec3(this._prevMidPoint.x,this._prevMidPoint.y,0);
            const currentWorldPos = new Vec3(currentMidPoint.x,currentMidPoint.y,0)
            console.log(prevWorldPos,currentWorldPos,'currentWorldPos1')
            console.log(this._prevMidPoint,currentMidPoint,'currentMidPoint2')
            console.log(JSON.stringify(this.targetNode.position),'1')
            // 计算偏移量（根据摄像机朝向调整方向）
            // console.log(JSON.stringify(currentWorldPos.subtract(prevWorldPos)),'1.50')
            // const delta = currentWorldPos.subtract(prevWorldPos).multiplyScalar(this.panSensitivity);
            const delta = currentWorldPos.subtract(prevWorldPos);
            console.log(JSON.stringify(delta),'1.5')
            // if(delta.x<0){
            //   delta.x = 5
            // }else{
            //   delta.x = -5
            // }
            // if(delta.y<0){
            //   delta.y = 5
            // }else{
            //   delta.y = -5
            // }
            this.targetNode.setPosition(this.targetNode.position.add(delta));
            console.log( this.targetNode.worldPosition)
            console.log(this.targetNode.position,'2')
            this._prevMidPoint = currentMidPoint;
        }
        

        // ----------- 处理缩放 -----------
        // const currentDistance = Vec2.distance(pos1, pos2);
        // if (this._prevDistance > 0) {
        //     const scaleFactor = 1 + (currentDistance - this._prevDistance) * this.zoomSensitivity;
        //     let newScale = this.targetNode.scale.clone().multiplyScalar(scaleFactor);

        //     // 限制缩放范围
        //     newScale.x = math.clamp(newScale.x, this.minScale, this.maxScale);
        //     newScale.y = math.clamp(newScale.y, this.minScale, this.maxScale);
        //     newScale.z = math.clamp(newScale.z, this.minScale, this.maxScale);

        //     this.targetNode.setScale(newScale);
        // }
        // this._prevDistance = currentDistance;
    }

    // 屏幕坐标转世界空间方向向量（用于平移）
    private screenToWorldVector(screenPos: Vec2): Vec3 {
        // 从摄像机发射射线，计算与近平面的交点
        const nearPos = new Vec3(screenPos.x, screenPos.y, 1);
        const farPos = new Vec3(screenPos.x, screenPos.y, 1000);
        const nearWorld = this.mainCamera!.screenToWorld(nearPos);
        const farWorld = this.mainCamera!.screenToWorld(farPos);
        console.log(farWorld.subtract(nearWorld).normalize(),this.mainCamera,'1111')

        // 返回方向向量（用于计算平移量）
        return farWorld.subtract(nearWorld).normalize();
    }

    onTouchEnd() {
        this._prevMidPoint = null;
        this._prevDistance = 0;
        this._prevRotation = new Vec3();
    }

    onDestroy() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }
}