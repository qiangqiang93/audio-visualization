const musics = [
    {
        name: '难念的经',
        cover: '/static/img/周华健.jpeg',
        path: '/static/music/难念的经.mp3'
    },
    {
        name: '你最珍贵',
        cover: '/static/img/你最珍贵.jpeg',
        path: '/static/music/你最珍贵.mp3',
    },
    {
        name: '天下无双',
        cover: '/static/img/张靓颖.jpg',
        path: '/static/music/天下无双.mp3',
    },
    {
        name: '遥远的她',
        cover: '/static/img/张学友.jpeg',
        path: '/static/music/遥远的她.mp3'
    }
]

class AudioItem {

    constructor(callback) {
        this._audioContext = new AudioContext()
        this._callback = callback
    }

    // 当前实例url
    _url

    // 音频上下文对象
    _audioContext

    // 音频源ArrayBuffer对象[只能播放一次]
    _audioBufferSourceNode

    // 用于分析音频频谱的节点
    _analyser

    // frequencyBinCount 的值固定为 AnalyserNode 接口中fftSize值的一半. 
    // 该属性通常用于可视化的数据值的数量
    _bufferLength

    // 播放状态[0:加载中,1:播放中,2:已暂停,3:已结束,4:已停止]
    _status = 0

    // 开始播放时间
    _startAt = 0

    // 暂停时间
    _pausedAt = 0

    // 音频时长
    _duration = 0

    // 解码后一系列操作
    _afterDecode() {
        // 创建AudioBufferSourceNode 用于播放解码出来的buffer的节点
        this._audioBufferSourceNode = this._audioContext.createBufferSource()
        // 创建AnalyserNode 用于分析音频频谱的节点
        this._analyser = this._audioContext.createAnalyser()
        // 接口的fftSize属性AnalyserNode是无符号长值，表示在执行快速傅里叶变换（FFT）以获取频域数据时使用的样本中的窗口大小
        this._analyser.fftSize = 512
        // 将不同的音频图节点连接在一起
        this._audioBufferSourceNode.connect(this._analyser)
        this._analyser.connect(this._audioContext.destination)
        // bufferLength
        this._bufferLength = this._analyser.frequencyBinCount
        //回调函数传入的参数
        this._audioBufferSourceNode.buffer = this._buffer
        //部分浏览器是noteOn()函数，用法相同
        this._audioBufferSourceNode.start(0, this._pausedAt / 1000)
        // 音频时长
        this._duration = this._audioBufferSourceNode.buffer.duration
        // 记录播放时间
        this._startAt = new Date().getTime() - this._pausedAt
        // 重置暂停时间
        this._pausedAt = 0
        // 更新播放状态
        this._status = 1
        // callback
        this._callback()
    }

    // 初始化
    _init(val) {
        if (val) {
            let data = this._source.slice()
            this._audioContext.decodeAudioData(data, buffer => {
                // 暂停、快进后播放重新解码耗时验证,明显卡顿,所以缓存一下buffer
                this._buffer = buffer
                this._afterDecode()
            })
        } else {
            this._afterDecode()
        }
    }

    // 获取音频资源
    _getSource(url) {
        fetch(url)
            .then(res => res.arrayBuffer())
            .then(res => {
                this._source = res.slice()
                this._init(1)
            })
    }

    // 获取绘制图像的数据
    getDataArray() {
        // 检查下是否播放完成
        let played = new Date().getTime() - this._startAt
        let total = this._duration * 1000
        if (played >= total) this.done()

        // 返回新arraybuffer
        let dataArray = new Uint8Array(this._bufferLength)
        this._analyser.getByteFrequencyData(dataArray)
        let tempArr = Array.from(dataArray)
        let len = this._bufferLength / 2
        tempArr = tempArr.slice(0, len)
        tempArr = tempArr.concat([...tempArr].reverse())
        return Uint8Array.from(tempArr)
    }

    // 获取播放时长
    getPlayed() {
        let played = new Date().getTime() - this._startAt
        return played
    }

    // 获取音频时长(秒)
    getDuration() {
        return this._duration
    }

    // play
    play(input) {
        // url,如果当前实例url和传入url不一致则获取新的音频并自动播放
        if (typeof input === 'string') {
            if (this._url !== input) {
                this._getSource(input)
                this._url = input
                return false
            } else {
                this._init()
            }
        }
        // 传入时间ms
        else if (typeof input === 'number') {
            this.pause(input)
            this._init()
        }
        else {
            this._init()
        }
    }

    // pause(ms)
    pause(time) {
        time = time || (new Date().getTime() - this._startAt)
        this._audioBufferSourceNode.stop()
        this._pausedAt = time
        this._status = 2
    }

    // done
    done() {
        this._audioBufferSourceNode.stop()
        this._pausedAt = 0
        this._startAt = 0
        this._status = 3
    }

    // stop
    stop() {
        if (this._audioBufferSourceNode) {
            this._audioBufferSourceNode.stop()
        }
        this._pausedAt = 0
        this._startAt = 0
        this._status = 4
    }

    // 获取当前播放状态
    getStatus() {
        return this._status
    }
}

class CanvasItem {
    constructor(element) {
        let canvas = document.querySelector(element)
        canvas.width = canvas.offsetWidth
        this.ctx = canvas.getContext('2d')
        canvas.height = canvas.offsetHeight
        this.r = canvas.width / 2
        this.d = canvas.width
        this._r = this.r * .7
        this.init()
    }

    init() {
        let data = (new Array(256)).fill(0)
        this.draw(data)
    }

    // 绘制柱状图
    draw(data) {
        let length = data.length
        this.ctx.clearRect(0, 0, this.d, this.d)
        data.forEach((item, index) => {
            let rotateArg = index * (360 / length) * (Math.PI / 180)
            this.ctx.translate(this.r, this.r)
            this.ctx.rotate(rotateArg)

            this.ctx.fillStyle = 'rgb(255, 0, 0)'
            this.ctx.fillRect(0, this._r, 2, 5 + item / 4)

            this.ctx.rotate(-rotateArg)
            this.ctx.translate(-this.r, -this.r)
        })
    }
}

class utils {

    static twoInt(val) {
        return val >= 10 ? val : '0' + val
    }

    static sToMs(val) {
        let m = Math.floor(val / 60)
        let s = Math.round(val % 60)
        return this.twoInt(m) + ':' + this.twoInt(s)
    }
}

window.addEventListener('load', function () {
    let draged = false
    let max = musics.length - 1
    let index = 0, audio, animation
    let canvas = new CanvasItem('#canvas')
    let body = document.querySelector('body')
    let play = document.querySelector('#play')
    let prev = document.querySelector('#prev')
    let next = document.querySelector('#next')
    let title = document.querySelector('.title')
    let point = document.querySelector('.point')
    let total = document.querySelector('.total-time')
    let progress = document.querySelector('.progress')
    let current = document.querySelector('.current-time')
    let hoverLimits = {
        min: document.querySelector('.audio-info').offsetLeft + progress.offsetLeft,
        max: document.querySelector('.audio-info').offsetLeft + progress.offsetLeft + progress.offsetWidth
    }

    // nextIndex
    const nextIndex = function(index) {
        index = index + 1
        return index > max ? 0 : index
    }

    // musicInit
    const musicInit = function (item) {
        audio.stop()
        title.innerText = item.name
        audio.play(musics[index].path)
        body.style.backgroundImage = `url(${item.cover})`
    }

    // drawGraphics
    const drawGraphics = function () {
        // 判断播放状态[暂停、完成、停止]
        let status = audio.getStatus()
        switch (status) {
            case 2:
                play.className = play.className.replace('icon-zanting', 'icon-caret-right')
                cancelAnimationFrame(animation)
                break;
            case 3:
                cancelAnimationFrame(animation)
                // 播放完成自动下一曲
                index = nextIndex(index)
                musicInit(musics[index])
                canvas.init()
                break;
            case 4:
                cancelAnimationFrame(animation)
                canvas.init()
                break;
            default:
                // 获取播放时间
                let _played = played = audio.getPlayed() / 1000
                played = utils.sToMs(played)
                current.innerText = played
                // 播放进度
                if (!draged) {
                    let _duration = _played / audio.getDuration()
                    point.style.left = (_duration * 100).toFixed(2) + '%'
                }
                // 判断当前音频是否播放完成
                if (audio.getStatus() == 3) {
                    cancelAnimationFrame(animation)
                    // 播放完成自动下一曲
                    index = nextIndex(index)
                    audio.play(musics[index])
                    canvas.init()
                    return false
                }
                animation = requestAnimationFrame(drawGraphics)
                let newArray = audio.getDataArray()
                canvas.draw(newArray)
                break;
        }
    }

    // pointMove
    const pointMove = function (event) {
        let pos
        draged = true
        let pageX = event.pageX
        let maxWidth = hoverLimits.max - hoverLimits.min
        if (pageX < hoverLimits.min) {
            pos = 0
        } else if (pageX > hoverLimits.max) {
            pos = maxWidth
        } else {
            pos = pageX - hoverLimits.min
        }
        pos = Math.round(pos / maxWidth * 100).toFixed(2) + '%'
        point.style.left = pos
    }

    // mouseHandler
    const mouseHandler = function () {
        document.removeEventListener('mouseup', mouseHandler)
        document.removeEventListener('mousemove', pointMove)
        let _progress = parseFloat(point.style.left) / 100
        let _duration = audio.getDuration()
        let t = _duration * _progress
        audio.play(t * 1000)
        draged = false
    }

    audio = new AudioItem(function () {
        let _total = audio.getDuration()
        _total = utils.sToMs(_total)
        total.innerText = _total
        drawGraphics()
    })

    play.addEventListener('click', function () {
        let url = musics[index].path
        if (audio.getStatus() == 1) {
            audio.pause()
        } else {
            audio.play(url)
            play.className = play.className.replace('icon-caret-right', 'icon-zanting')
        }
    })

    prev.addEventListener('click', function () {
        index = index - 1
        if (index < 0) {
            index = max
        }
        musicInit(musics[index])
    })

    next.addEventListener('click', function () {
        index = nextIndex(index)
        musicInit(musics[index])
    })

    progress.addEventListener('click', function (event) {
        // 如果是point冒泡上来到事件,则不做任何处理,click和mouse事件会有冲突,point阻止冒泡会繁琐一些
        if (event.target.className.indexOf('point') !== -1) return false
        let _progress = event.offsetX / event.target.offsetWidth
        let startTime = audio.getDuration() * _progress
        audio.play(startTime * 1000)
    })

    point.addEventListener('mousedown', function () {
        document.addEventListener('mousemove', pointMove)
        document.addEventListener('mouseup', mouseHandler)
    })

    // 默认加载封面和歌曲名
    musicInit(musics[index])
})