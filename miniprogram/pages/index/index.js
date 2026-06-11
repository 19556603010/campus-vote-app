const app = getApp()

Page({
  data: {
    voteList: [],
    currentFilter: 'all',
    totalVotes: 0,
    activeVotes: 0
  },

  onLoad: function () {
    this.loadVotes()
  },

  onShow: function () {
    this.loadVotes()
  },

  loadVotes: function () {
    const allVotes = app.getAllVotes()
    const activeVotes = allVotes.filter(v => v.status === 'active').length
    
    this.setData({
      voteList: allVotes,
      totalVotes: allVotes.length,
      activeVotes: activeVotes
    })
    this.applyFilter()
  },

  setFilter: function (e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({
      currentFilter: filter
    })
    this.applyFilter()
  },

  applyFilter: function () {
    const { currentFilter } = this.data
    const allVotes = app.getAllVotes()
    
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
      success: (res) => {
        if (res.confirm) {
          const success = app.deleteVote(id)
          if (success) {
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            })
            this.loadVotes()
          } else {
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