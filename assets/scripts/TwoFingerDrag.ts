import { _decorator, Component, Node, input, Input, EventTouch, Vec2, Vec3, Camera } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ModelControl')
export class ModelControl extends Component {
    // 目标模型节点
    @property(Node)
    private targetNode: Node = null;

    // 缩放比例限制
    @property
    private minScale: number = 0.1;
    @property
    private maxScale: number = 10;

    // 缩放初始值
    private originalTouchDistance: number = -1;
    private originalNodeScale: Vec3 = new Vec3(1, 1, 1);

    // 旋转初始值
    private isRotating: boolean = false;
    private rotationStart: Vec2 = new Vec2();
    private rotationCenter: Vec3 = new Vec3();

    // 拖动初始值
    private isDragging: boolean = false;
    private dragStart: Vec2 = new Vec2();
    private dragOffset: Vec3 = new Vec3();

    start() {
        // 监听触摸事件
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onTouchStart(event: EventTouch) {
        const touches = event.getTouches();
        if (touches.length === 1) {
            // 单指触摸开始，记录旋转起点
            this.isRotating = true;
            this.rotationStart = touches[0].getLocation();
            this.rotationCenter = this.targetNode.position.clone();
        } else if (touches.length === 2) {
            // 双指触摸开始，记录缩放初始间距
            this.originalTouchDistance = Vec2.distance(touches[0].getLocation(), touches[1].getLocation());
            this.originalNodeScale = this.targetNode.scale.clone();
        }
    }

    onTouchMove(event: EventTouch) {
        const touches = event.getTouches();
        if (touches.length === 1 && this.isRotating) {
            // 单指拖动旋转
            const currentPos = touches[0].getLocation();
            const delta = Vec2.subtract(new Vec2(), currentPos, this.rotationStart);
            const angle = delta.angle();
            this.targetNode.rotation = this.targetNode.rotation.add(new Vec3(0, angle, 0));
            this.rotationStart = currentPos;
        } else if (touches.length === 2) {
            // 双指拖动缩放和平移
            const touch1 = touches[0];
            const touch2 = touches[1];
            const currentDistance = Vec2.distance(touch1.getLocation(), touch2.getLocation());
            const scale = currentDistance / this.originalTouchDistance;

            // 缩放模型
            // const newScale = Vec3.multiplyScalar(new Vec3(), this.originalNodeScale, scale);
            // newScale.x = Math.clamp(newScale.x, this.minScale, this.maxScale);
            // newScale.y = Math.clamp(newScale.y, this.minScale, this.maxScale);
            // newScale.z = Math.clamp(newScale.z, this.minScale, this.maxScale);
            // this.targetNode.setScale(newScale);

            // 平移模型（根据双指中心点进行平移）
            if (!this.isDragging) {
                this.isDragging = true;
                const midPoint = Vec2.midpoint(new Vec2(), touch1.getLocation(), touch2.getLocation());
                this.dragStart = midPoint;
                this.dragOffset = this.targetNode.position.clone().sub(this.cameraToWorld(midPoint));
            }
            const dragCurrent = this.cameraToWorld(Vec2.midpoint(new Vec2(), touch1.getLocation(), touch2.getLocation()));
            this.targetNode.position = dragCurrent.add(this.dragOffset);
        }
    }

    onTouchEnd(event: EventTouch) {
        const touches = event.getTouches();
        if (touches.length === 0) {
            // 触摸结束，重置状态
            this.isRotating = false;
            this.isDragging = false;
        }
    }

    // 辅助函数：将屏幕坐标转换为世界坐标
    private cameraToWorld(screenPos: Vec2): Vec3 {
        const camera = this.node.getComponentInChildren(Camera);
        const viewSize = camera.node.getComponent(camera.CameraComponent).getViewSize();
        const worldPos = camera.screenToWorld(new Vec3(screenPos.x / viewSize.width * 2 - 1, -screenPos.y / viewSize.height * 2 + 1, -camera.node.position.z));
        return worldPos;
    }
}
