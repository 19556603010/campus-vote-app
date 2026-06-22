// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'cloud1-d4g13ncrb52e37834',
        traceUser: true,
      })
    }

    // 读取本地存储的用户信息
    let userInfo = null
    try {
      userInfo = wx.getStorageSync('userInfo')
    } catch (e) {
      userInfo = null
    }

    // 兼容旧数据：如果没有 isRealUser 标志，说明是之前自动生成的随机昵称，清空它
    if (userInfo && userInfo.nickName && !userInfo.isRealUser) {
      userInfo = null
      try { wx.removeStorageSync('userInfo') } catch (e) {}
    }

    this.globalData = {
      openid: null,
      userInfo: userInfo || { nickName: '', avatarUrl: '' }
    }

    this.getOpenId()
  },

  getOpenId: async function () {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOpenId'
      })
      this.globalData.openid = res.result.openid
      console.log('openid:', this.globalData.openid)
    } catch (err) {
      console.error('获取openid失败:', err)
    }
  },

  login: function () {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          const userInfo = {
            nickName: res.userInfo.nickName,
            avatarUrl: res.userInfo.avatarUrl,
            isRealUser: true
          }
          this.globalData.userInfo = userInfo
          try { wx.setStorageSync('userInfo', userInfo) } catch (e) {}
          resolve(userInfo)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  updateUserInfo: function (partial) {
    const merged = Object.assign({}, this.globalData.userInfo || {}, partial || {})
    this.globalData.userInfo = merged
    try { wx.setStorageSync('userInfo', merged) } catch (e) {}
    return merged
  },

  globalData: {
    openid: null,
    userInfo: null
  }
})
