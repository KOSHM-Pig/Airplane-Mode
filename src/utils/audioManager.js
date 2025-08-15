/**
 * 音频管理器
 * 负责处理应用中的音频播放功能
 */

/**
 * 音频路径
 */

const AUDIO_PATH = {
  'takeoff': '/audio/takeoff.ogg',
}

class AudioManager {
  constructor() {
    this.audioCache = new Map() // 音频缓存
    this.currentAudio = null // 当前播放的音频
    this.volume = 1.0 // 默认音量
  }

  /**
   * 预加载音频文件
   * @param {string} name - 音频名称
   * @param {string} src - 音频文件路径
   */
  preload(name, src) {
    if (this.audioCache.has(name)) {
      return this.audioCache.get(name)
    }

    const audio = new Audio(src)
    audio.preload = 'auto'
    audio.volume = this.volume

    // 添加错误处理
    audio.addEventListener('error', (e) => {
      console.error(`音频加载失败: ${name}`, e)
    })

    // 添加加载完成事件
    audio.addEventListener('canplaythrough', () => {
      console.log(`音频预加载完成: ${name}`)
    })

    this.audioCache.set(name, audio)
    return audio
  }

  /**
   * 播放音频
   * @param {string} name - 音频名称
   * @param {Object} options - 播放选项
   * @returns {Promise} 播放Promise
   */
  async play(name, options = {}) {
    try {
      const audio = this.audioCache.get(name)
      if (!audio) {
        throw new Error(`音频未找到: ${name}`)
      }

      // 停止当前播放的音频（如果有）
      if (this.currentAudio && !this.currentAudio.paused) {
        this.currentAudio.pause()
        this.currentAudio.currentTime = 0
      }

      // 设置音频选项
      if (options.volume !== undefined) {
        audio.volume = Math.max(0, Math.min(1, options.volume))
      }
      
      if (options.loop !== undefined) {
        audio.loop = options.loop
      }

      // 重置播放位置
      audio.currentTime = 0
      this.currentAudio = audio

      console.log(`🔊 开始播放音频: ${name}`)
      
      // 播放音频
      await audio.play()
      
      return new Promise((resolve, reject) => {
        const onEnded = () => {
          console.log(`🔊 音频播放完成: ${name}`)
          audio.removeEventListener('ended', onEnded)
          audio.removeEventListener('error', onError)
          this.currentAudio = null
          resolve()
        }

        const onError = (e) => {
          console.error(`🔊 音频播放错误: ${name}`, e)
          audio.removeEventListener('ended', onEnded)
          audio.removeEventListener('error', onError)
          this.currentAudio = null
          reject(e)
        }

        audio.addEventListener('ended', onEnded)
        audio.addEventListener('error', onError)
      })

    } catch (error) {
      console.error(`音频播放失败: ${name}`, error)
      throw error
    }
  }

  /**
   * 停止当前播放的音频
   */
  stop() {
    if (this.currentAudio && !this.currentAudio.paused) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
      console.log('🔊 音频播放已停止')
    }
  }

  /**
   * 设置全局音量
   * @param {number} volume - 音量 (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    
    // 更新所有缓存音频的音量
    this.audioCache.forEach(audio => {
      audio.volume = this.volume
    })
    
    console.log(`🔊 音量设置为: ${(this.volume * 100).toFixed(0)}%`)
  }

  /**
   * 获取当前音量
   */
  getVolume() {
    return this.volume
  }

  /**
   * 检查音频是否正在播放
   */
  isPlaying() {
    return this.currentAudio && !this.currentAudio.paused
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stop()
    this.audioCache.clear()
    console.log('🔊 音频管理器已清理')
  }
}

// 创建全局音频管理器实例
const audioManager = new AudioManager()

// 预加载应用音频文件
audioManager.preload('takeoff', AUDIO_PATH.takeoff)

export default audioManager
