import { _decorator, Component, Node, Vec3, EventTouch, Vec2, math, input, Input, clamp } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ModelController')
export class ModelController extends Component {
  // 旋转灵敏度
  @property({ tooltip: "旋转灵敏度" })
  rotateSensitivity: number = 0.3;

  // 平移灵敏度
  @property({ tooltip: "平移灵敏度" })
  panSensitivity: number = 0.005;

  // 缩放灵敏度
  @property({ tooltip: "缩放灵敏度" })
  zoomSensitivity: number = 0.1;

  // 缩放范围限制
  @property({ tooltip: "最小缩放比例" })
  minScale: number = 0.5;
  @property({ tooltip: "最大缩放比例" })
  maxScale: number = 2;

  // X轴旋转角度限制
  @property
  clampX: boolean = true;
  @property
  minX: number = -90;
  @property
  maxX: number = 90;

  // 私有变量
  private _touchCache: Map<number, Vec2> = new Map();
  private _initialDistance: number = 0;
  private _initialScale: number = 1;
  private _prevTouchCount: number = 0;
  private _prevDistance: number = 0; // 双指距离
  private _prevMidPoint: Vec2 | null = null; // 双指中点（屏幕坐标）
  private _prevRotation: Vec3 = new Vec3(); // 模型初始欧拉角

  onLoad() {
    input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  onDestroy() {
    input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
    input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
    input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
  }

  // 触摸开始
  onTouchStart(event: EventTouch) {
    event.propagationStopped = true;
    const touches = event.getTouches();
    console.log(touches, '111')
    // 记录触摸点
    touches.forEach(touch => {
      this._touchCache.set(touch.getID(), touch.getLocation());
    });

    // 双指初始化
    if (this._touchCache.size === 2) {
      const [pos1, pos2] = this.getTouchPositions();
      this._initialDistance = pos1.subtract(pos2).length();
      this._initialScale = this.node.getScale().x;
      // 双指：记录初始距离和中点
      this._prevDistance = Vec2.distance(pos1, pos2);
      console.log('111')
      this._prevMidPoint = new Vec2((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
    }
  }

  // 触摸移动
  onTouchMove(event: EventTouch) {
    const touches = event.getTouches();
    console.log(touches, 'touches')
    switch (touches.length) {
      case 1: // 单指旋转
        this.handleRotation(event);
        break;
      case 2: // 双指平移/缩放
        if (this.checkSameTouches(event)) {
          this.handlePanAndZoom(event);
        }
        break;
    }
  }

  // 触摸结束
  onTouchEnd(event: EventTouch) {
    event.getTouches().forEach(touch => {
      this._touchCache.delete(touch.getID());
    });
  }

  // 处理旋转
  private handleRotation(event: EventTouch) {
    const delta = event.getDelta(); // 获取触摸位移增量
    const rotation = this.node.eulerAngles;

    // 计算新的旋转角度
    let newX = rotation.x - delta.y * this.rotateSensitivity;
    let newY = rotation.y + delta.x * this.rotateSensitivity;

    // 限制X轴旋转范围
    if (this.clampX) {
      newX = Math.min(Math.max(newX, this.minX), this.maxX);
    }

    // 应用旋转
    this.node.setRotationFromEuler(new Vec3(newX, newY, rotation.z));
  }

  // 处理平移和缩放
  private handlePanAndZoom(event: EventTouch) {
    const [pos1, pos2] = this.getTouchPositions();
    // 双指缩放
    if (this._prevDistance > 0) {
      const currentDistance = pos1.subtract(pos2).length();
      const scaleFactor = currentDistance / this._initialDistance;
      const newScale = clamp(
        this._initialScale * scaleFactor,
        this.minScale,
        this.maxScale
      );
      this.node.setScale(new Vec3(newScale, newScale, newScale));
    }

    // 双指平移
    if (this._prevMidPoint) {
      const currentMidPoint = new Vec2((pos1.x + pos2.x) / 2, (pos1.y + pos2.y) / 2);
      // 将屏幕坐标转换为世界坐标方向向量
      // const prevWorldPos = this.screenToWorldVector(this._prevMidPoint);
      // const currentWorldPos = this.screenToWorldVector(currentMidPoint);
      const prevWorldPos = new Vec3(this._prevMidPoint.x, this._prevMidPoint.y, 0);
      const currentWorldPos = new Vec3(currentMidPoint.x, currentMidPoint.y, 0)
      // 计算偏移量（根据摄像机朝向调整方向）
      // console.log(JSON.stringify(currentWorldPos.subtract(prevWorldPos)),'1.50')
      // const delta = currentWorldPos.subtract(prevWorldPos).multiplyScalar(this.panSensitivity);
      const delta = currentWorldPos.subtract(prevWorldPos);
      console.log(JSON.stringify(delta), '1.5')
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
      this.node.setPosition(this.node.position.add(delta));
      this._prevMidPoint = currentMidPoint;
    }
    // const currentCenter = pos1.add(pos2).multiplyScalar(0.5);
    // const previousCenter = this.getPreviousTouchCenter();
    // const delta = currentCenter.subtract(previousCenter);

    // const position = this.node.position;
    // this.node.setPosition(new Vec3(
    //   position.x + delta.x * this.panSensitivity,
    //   position.y + delta.y * this.panSensitivity,
    //   position.z
    // ));

    // 更新触摸点缓存
    event.getTouches().forEach(touch => {
      this._touchCache.set(touch.getID(), touch.getLocation());
    });
  }

  // 工具方法：获取两个触摸点位置
  private getTouchPositions(): [Vec2, Vec2] {
    const values = Array.from(this._touchCache.values());
    return [values[0], values[1]];
  }

  // 工具方法：获取之前的触摸中心点
  private getPreviousTouchCenter(): Vec2 {
    const [pos1, pos2] = this.getTouchPositions();
    return pos1.add(pos2).multiplyScalar(0.5);
  }

  // 验证是否为同一组触摸点
  private checkSameTouches(event): boolean {
    const touches = event.getTouches();
    return touches.every(t =>
      this._touchCache.has(t.getID())
    );
  }
}