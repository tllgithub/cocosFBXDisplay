import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('LoadingLayer')
export class LoadingLayer extends Component {
    onLoad() {
        console.log("LoadingLayer onLoad")
        this.node.active = true
        // 添加常驻节点
        director.addPersistRootNode(this.node);
    }

    start() {
        console.log("LoadingLayer start")
    }

    showLoading() {
        this.node.active = true
    }

    update(deltaTime: number) {
        
    }
}


