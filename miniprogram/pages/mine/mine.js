// pages/mine/mine.js
const app = getApp()

const TAB_CREATED = 'created'
const TAB_VOTED = 'voted'
const PAGE_SIZE = 10

Page({
  data: {
    userInfo: { nickName: '', avatarUrl: '' },
    openidTail: '',
    currentTab: TAB_CREATED,
    createdList: [],
    votedList: [],
    loading: false,
    createdHasMore: true,
    votedHasMore: true,
    createdPage: 1,
    votedPage: 1,
    showEditModal: false,
    editingNickName: '',
    editingAvatarUrl: ''
  },

  onShow: function () {
    this.syncUserInfo()
    this.reloadCurrentTab()
  },

  onPullDownRefresh: function () {
    this.reloadCurrentTab().then(() => wx.stopPullDownRefresh())
  },

  onReachBottom: function () {
    if (this.data.loading) return
    this.loadMore()
  },

  syncUserInfo: function () {
    const userInfo = (app.globalData && app.globalData.userInfo) || { nickName: '', avatarUrl: '' }
    const openid = (app.globalData && app.globalData.openid) || ''
    this.setData({
      userInfo: userInfo,
      openidTail: openid ? openid.slice(-6) : ''
    })
  },

  reloadCurrentTab: function () {
    if (this.data.currentTab === TAB_CREATED) {
      this.setData({ createdList: [], createdPage: 1, createdHasMore: true })
      return this.loadCreated(1, true)
    }
    this.setData({ votedList: [], votedPage: 1, votedHasMore: true })
    return this.loadVoted(1, true)
  },

  loadMore: function () {
    if (this.data.currentTab === TAB_CREATED && this.data.createdHasMore) {
      return this.loadCreated(this.data.createdPage + 1, false)
    }
    if (this.data.currentTab === TAB_VOTED && this.data.votedHasMore) {
      return this.loadVoted(this.data.votedPage + 1, false)
    }
  },

  switchTab: function (e) {
    const tab = e.currentTarget.dataset.tab
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    this.reloadCurrentTab()
  },

  loadCreated: async function (page, reset) {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyCreatedVotes',
        data: { page: page, pageSize: PAGE_SIZE }
      })
      if (res.result && res.result.success) {
        const list = (res.result.list || []).map(v => this.normalizeVote(v))
        const merged = reset ? list : this.data.createdList.concat(list)
        this.setData({
          createdList: merged,
          createdPage: page,
          createdHasMore: !!res.result.hasMore,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载我创建的失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  loadVoted: async function (page, reset) {
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getMyVotedVotes',
        data: { page: page, pageSize: PAGE_SIZE }
      })
      if (res.result && res.result.success) {
        const list = (res.result.list || []).map(v => this.normalizeVote(v))
        const merged = reset ? list : this.data.votedList.concat(list)
        this.setData({
          votedList: merged,
          votedPage: page,
          votedHasMore: !!res.result.hasMore,
          loading: false
        })
      } else {
        this.setData({ loading: false })
      }
    } catch (err) {
      console.error('加载我参与的失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ loading: false })
    }
  },

  normalizeVote: function (v) {
    if (!v) return v
    if (typeof v.createTime === 'object' && v.createTime && v.createTime.$date) {
      v.createTimeStr = this.formatTime(v.createTime.$date)
    } else if (v.createTime) {
      v.createTimeStr = this.formatTime(v.createTime)
    } else {
      v.createTimeStr = ''
    }
    return v
  },

  goToDetail: function (e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },

  formatTime: function (date) {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    return (d.getMonth() + 1) + '/' + d.getDate()
  },

  // ---------- 编辑昵称(降级方案) ----------
  openEditModal: function () {
    const u = this.data.userInfo || {}
    this.setData({
      showEditModal: true,
      editingNickName: u.nickName || '',
      editingAvatarUrl: u.avatarUrl || ''
    })
  },

  closeEditModal: function () {
    this.setData({ showEditModal: false })
  },

  onNickInput: function (e) {
    this.setData({ editingNickName: e.detail.value })
  },

  onAvatarInput: function (e) {
    this.setData({ editingAvatarUrl: e.detail.value })
  },

  saveUserInfo: function () {
    const nick = (this.data.editingNickName || '').trim()
    if (!nick) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' })
      return
    }
    if (nick.length > 20) {
      wx.showToast({ title: '昵称不超过20字', icon: 'none' })
      return
    }
    const merged = app.updateUserInfo({
      nickName: nick,
      avatarUrl: (this.data.editingAvatarUrl || '').trim()
    })
    this.setData({ userInfo: merged, showEditModal: false })
    wx.showToast({ title: '已保存', icon: 'success' })
  }
})
