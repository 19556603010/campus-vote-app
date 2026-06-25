const app = getApp()

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    myVotes: [],
    myVoteCount: 0,
    votedCount: 0
  },

  onLoad: function () {
    this.loadData()
  },

  onShow: function () {
    this.loadData()
  },

  loadData: function () {
    wx.showLoading({ title: '加载中...' })
    try {
      this.setData({
        userInfo: app.globalData.userInfo,
        isLoggedIn: app.globalData.isLoggedIn
      })
      this.loadMyVotes()
      this.loadVotedCount()
    } catch (e) {
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  loadMyVotes: function () {
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo) {
      this.setData({ myVotes: [], myVoteCount: 0 })
      return
    }
    const allVotes = app.getAllVotes()
    const myVotes = allVotes.filter(v => v.creatorOpenid === app.globalData.userInfo.openid)
    this.setData({
      myVotes: myVotes,
      myVoteCount: myVotes.length
    })
  },

  loadVotedCount: function () {
    try {
      const votedData = wx.getStorageSync('votedOptions')
      if (votedData) {
        const votedMap = JSON.parse(votedData)
        this.setData({ votedCount: Object.keys(votedMap).length })
      } else {
        this.setData({ votedCount: 0 })
      }
    } catch (e) {
      this.setData({ votedCount: 0 })
    }
  },

  doLogin: function () {
    if (this.data.isLoggedIn) return
    app.login(() => {
      this.loadData()
    })
  },

  logout: function () {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.loadData()
        }
      }
    })
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  goToCreate: function () {
    wx.switchTab({
      url: '/pages/create/create'
    })
  },

  changeAvatar: function () {
    if (!this.data.isLoggedIn) return
    app.uploadAvatar(() => {
      this.loadData()
    })
  },

  clearCache: function () {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('votedOptions')
            wx.showToast({ title: '清除成功', icon: 'success' })
            this.loadVotedCount()
          } catch (e) {
            wx.showToast({ title: '清除失败', icon: 'none' })
          }
        }
      }
    })
  },

  formatTime: function (date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
})