const app = getApp()

Page({
  data: {
    title: '',
    description: '',
    options: ['', ''],
    voteType: 'single',
    endDate: '',
    isAnonymous: false,
    coverImage: ''
  },

  chooseImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          coverImage: tempFilePath
        })
      },
      fail: () => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  uploadImage: async function (filePath) {
    return new Promise((resolve, reject) => {
      const cloudPath = 'vote_covers/' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.png'
      
      wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath,
        success: (res) => {
          resolve(res.fileID)
        },
        fail: (err) => {
          console.error('上传图片失败:', err)
          reject(err)
        }
      })
    })
  },

  onTitleInput: function (e) {
    this.setData({
      title: e.detail.value
    })
  },

  onDescInput: function (e) {
    this.setData({
      description: e.detail.value
    })
  },

  onOptionInput: function (e) {
    const index = e.currentTarget.dataset.index
    const options = [...this.data.options]
    options[index] = e.detail.value
    this.setData({
      options: options
    })
  },

  addOption: function () {
    if (this.data.options.length < 6) {
      this.setData({
        options: [...this.data.options, '']
      })
    }
  },

  deleteOption: function (e) {
    const index = e.currentTarget.dataset.index
    if (this.data.options.length > 2) {
      const options = this.data.options.filter((_, i) => i !== index)
      this.setData({
        options: options
      })
    }
  },

  setVoteType: function (e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      voteType: type
    })
  },

  onDateChange: function (e) {
    this.setData({
      endDate: e.detail.value
    })
  },

  onAnonymousChange: function (e) {
    this.setData({
      isAnonymous: e.detail.value
    })
  },

  submitVote: async function () {
    const { title, options } = this.data
    
    if (!title.trim()) {
      wx.showToast({
        title: '请输入投票标题',
        icon: 'none'
      })
      return
    }

    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) {
      wx.showToast({
        title: '至少需要2个选项',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '发布中...'
    })

    try {
      const userInfo = (app.globalData && app.globalData.userInfo) || {}
      
      let coverFileId = null
      if (this.data.coverImage) {
        coverFileId = await this.uploadImage(this.data.coverImage)
      }

      const res = await wx.cloud.callFunction({
        name: 'createVote',
        data: {
          title: title.trim(),
          description: this.data.description.trim(),
          options: validOptions.map(opt => ({
            text: opt.trim(),
            votes: 0
          })),
          voteType: this.data.voteType,
          endDate: this.data.endDate || null,
          isAnonymous: this.data.isAnonymous,
          creatorName: userInfo.nickName || '匿名用户',
          coverImage: coverFileId
        }
      })

      wx.hideLoading()
      
      if (res.result && res.result._id) {
        wx.showToast({
          title: '发布成功',
          icon: 'success'
        })
        
        this.setData({
          title: '',
          description: '',
          options: ['', ''],
          voteType: 'single',
          endDate: '',
          isAnonymous: false
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: '发布失败',
          icon: 'none'
        })
      }
    } catch (err) {
      console.error('发布投票失败:', err)
      wx.hideLoading()
      wx.showToast({
        title: '发布失败',
        icon: 'none'
      })
    }
  }
})
