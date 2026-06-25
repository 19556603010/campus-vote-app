App({
  onLaunch: function () {
    this.globalData = {
      votes: [],
      userInfo: null,
      isLoggedIn: false
    }
    this.loadVotesFromStorage()
    this.checkLoginStatus()
  },

  checkLoginStatus: function () {
    try {
      const userData = wx.getStorageSync('userInfo')
      if (userData) {
        this.globalData.userInfo = JSON.parse(userData)
        this.globalData.isLoggedIn = true
      }
    } catch (e) {
      console.error('加载用户信息失败:', e)
    }
  },

  login: function (callback) {
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success: (res) => {
        if (res.code) {
          // 模拟获取用户信息（实际需要后端通过code获取openid）
          wx.getUserProfile({
            desc: '用于展示用户头像和昵称',
            success: (userRes) => {
              const userInfo = {
                openid: 'user_' + res.code.substring(0, 16), // 模拟openid
                nickName: userRes.userInfo.nickName,
                avatarUrl: userRes.userInfo.avatarUrl,
                loginTime: new Date().toISOString()
              }
              this.globalData.userInfo = userInfo
              this.globalData.isLoggedIn = true
              try {
                wx.setStorageSync('userInfo', JSON.stringify(userInfo))
              } catch (e) {
                console.error('保存用户信息失败:', e)
              }
              wx.hideLoading()
              wx.showToast({ title: '登录成功', icon: 'success', duration: 2000 })
              if (callback) callback(userInfo)
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '登录失败', icon: 'none' })
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  },

  logout: function () {
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    try {
      wx.removeStorageSync('userInfo')
    } catch (e) {}
    wx.showToast({ title: '已退出登录', icon: 'success', duration: 1500 })
  },

  uploadAvatar: function (callback) {
    wx.showLoading({ title: '上传中...' })
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const fileManager = wx.getFileSystemManager()
        const timestamp = Date.now()
        const cloudPath = `${wx.env.USER_DATA_PATH}/avatar_${timestamp}.jpg`

        fileManager.saveFile({
          tempFilePath: tempFilePath,
          filePath: cloudPath,
          success: (saveRes) => {
            this.globalData.userInfo.avatarUrl = saveRes.savedFilePath
            try {
              wx.setStorageSync('userInfo', JSON.stringify(this.globalData.userInfo))
            } catch (e) {}
            wx.hideLoading()
            wx.showToast({ title: '上传成功', icon: 'success', duration: 2000 })
            if (callback) callback(saveRes.savedFilePath)
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
      }
    })
  },

  loadVotesFromStorage: function () {
    try {
      const data = wx.getStorageSync('votes')
      if (data) {
        this.globalData.votes = JSON.parse(data)
      }
    } catch (e) {
      console.error('加载投票数据失败:', e)
    }
  },

  saveVotesToStorage: function () {
    try {
      wx.setStorageSync('votes', JSON.stringify(this.globalData.votes))
    } catch (e) {
      console.error('保存投票数据失败:', e)
    }
  },

  addVote: function (vote) {
    const newVote = {
      ...vote,
      _id: Date.now().toString(),
      createTime: new Date(),
      totalVoters: 0,
      status: 'active',
      creatorOpenid: this.globalData.userInfo ? this.globalData.userInfo.openid : null,
      creatorName: this.globalData.userInfo ? this.globalData.userInfo.nickName : '匿名用户',
      creatorAvatar: this.globalData.userInfo ? this.globalData.userInfo.avatarUrl : ''
    }
    this.globalData.votes.unshift(newVote)
    this.saveVotesToStorage()
    return newVote
  },

  getVoteById: function (id) {
    return this.globalData.votes.find(v => v._id === id)
  },

  updateVote: function (id, updates) {
    const index = this.globalData.votes.findIndex(v => v._id === id)
    if (index > -1) {
      this.globalData.votes[index] = { ...this.globalData.votes[index], ...updates }
      this.saveVotesToStorage()
      return this.globalData.votes[index]
    }
    return null
  },

  deleteVote: function (id) {
    const index = this.globalData.votes.findIndex(v => v._id === id)
    if (index > -1) {
      this.globalData.votes.splice(index, 1)
      this.saveVotesToStorage()
      return true
    }
    return false
  },

  getAllVotes: function () {
    return this.globalData.votes
  }
})