import { _decorator, Component, director, instantiate, Node, Prefab, resources } from 'cc';
import { LoadingLayer } from './LoadingLayer';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {

    onLoad() {
    }

    start() {
        this.initLoading()
        this.showLoading()
    }

    update(deltaTime: number) {

    }

    showLoading() {
        let curScene = director.getScene()
        let loadingNode = curScene.getChildByName("LoadingLayer")
        if (!loadingNode) {
            this.initLoading()
            return
        }
    }

    initLoading() {
        let curScene = director.getScene()
        let loadNode = curScene.getChildByName("LoadingLayer")
        if (loadNode) {
            return
        }

        let url = "prefab/loading_layer/LoadingLayer"
        let call = function (err, file) {
            if (err) {
                console.warn(err)

            } else {
                let scene = director.getScene()// 异步加载回来的时候 场景可能会被切换
                let newNode: Node = instantiate(file)
                scene.addChild(newNode);
                console.log("LoadingLayer 加载完成")
            }
        }
        resources.load(url, Prefab, call)
    }
}


