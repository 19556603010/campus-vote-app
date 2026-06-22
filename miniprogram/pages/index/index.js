const app = getApp()

Page({
  data: {
    voteList: [],
    currentFilter: 'all',
    totalVotes: 0,
    activeVotes: 0,
    loading: true
  },

  onLoad: function () {
    this.loadVotes()
  },

  onShow: function () {
    this.loadVotes()
    this.setData({
      userInfo: app.globalData.userInfo || {}
    })
  },

  goLogin: async function () {
    try {
      await app.login()
      this.setData({
        userInfo: app.globalData.userInfo || {}
      })
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
    } catch (err) {
      console.error('登录失败:', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },

  loadVotes: async function () {
    this.setData({ loading: true })
    
    try {
      const res = await wx.cloud.callFunction({
        name: 'getVotes',
        data: {}
      })
      
      if (res.result && res.result.data) {
        const allVotes = res.result.data
        const activeVotes = allVotes.filter(v => v.status === 'active').length
        
        this.setData({
          voteList: allVotes,
          totalVotes: allVotes.length,
          activeVotes: activeVotes,
          loading: false
        })
        this.applyFilter()
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载投票列表失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  setFilter: function (e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      currentFilter: filter
    })
    this.applyFilter()
  },

  applyFilter: function () {
    const { currentFilter, voteList: allVotes } = this.data
    
    let filteredVotes = allVotes
    if (currentFilter === 'active') {
      filteredVotes = allVotes.filter(v => v.status === 'active')
    } else if (currentFilter === 'ended') {
      filteredVotes = allVotes.filter(v => v.status === 'ended')
    }
    
    this.setData({
      voteList: filteredVotes
    })
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    })
  },

  deleteVote: function (e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个投票吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await wx.cloud.callFunction({
              name: 'deleteVote',
              data: { voteId: id }
            })
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadVotes()
          } catch (err) {
            console.error('删除投票失败:', err)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  },

  formatTime: function (date) {
    if (!date) return ''
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return `${d.getMonth() + 1}/${d.getDate()}`
  }
})
