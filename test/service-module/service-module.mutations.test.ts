/*
eslint
@typescript-eslint/explicit-function-return-type: 0,
@typescript-eslint/no-explicit-any: 0
*/
import { assert } from 'chai'
import { assertGetter } from '../test-utils'
import makeServiceMutations from '../../src/service-module/service-module.mutations'
import makeServiceState from '../../src/service-module/service-module.state'
import errors from '@feathersjs/errors'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const options = {
  idField: '_id',
  autoRemove: false,
  serverAlias: 'myApi'
}

const {
  addItem,
  addItems,
  updateItem,
  updateItems,
  removeItem,
  removeItems,
  clearAll,
  createCopy,
  resetCopy,
  commitCopy,
  clearCopy,
  updatePaginationForQuery,
  setPending,
  unsetPending,
  setError,
  clearError
} = makeServiceMutations()

describe('Service Module - Mutations', function() {
  beforeEach(function() {
    this.state = makeServiceState('mutation-todos', options)
    this.state.keepCopiesInStore = true
  })

  describe('Create, Update, Remove', function() {
    it('addItem', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }

      addItem(state, item1)
      assert(state.ids.length === 1)
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)

      // Add item 2
      addItem(state, item2)
      assert(state.ids.length === 2)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)

      // Re-add item 1
      addItem(state, item1)
      assert(state.ids.length === 2, 'still only two items in the ids array')
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)
    })

    it('addItems', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)
      assert(state.ids.length === 2, 'still only two items in the ids array')
      assert(state.ids[0] === 1)
      assert(state.keyedById[1].test)
      assert(state.ids[1] === 2)
      assert(state.keyedById[2].test)
    })

    it('updateItems', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      const item2updated = {
        _id: 2,
        test: false
      }
      const itemsToUpdate = [item1updated, item2updated]
      updateItems(state, itemsToUpdate)

      assert(state.keyedById[1].test === false)
      assert(state.keyedById[2].test === false)
    })

    it('removeItem', function() {
      const state = this.state

      addItem(state, { _id: 1, test: true })
      removeItem(state, 1)

      assert(state.ids.length === 0)
      assert(Object.keys(state.keyedById).length === 0)
    })

    it('removeItems with array of ids', function() {
      const state = this.state
      const items = [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ]
      addItems(state, items)
      const itemsToRemove = [1, 2]
      removeItems(state, itemsToRemove)

      assert(state.ids.length === 2, 'should have 2 ids left')
      assert(
        Object.keys(state.keyedById).length === 2,
        'should have 2 items left'
      )
    })

    it('removeItems with array of items', function() {
      const state = this.state
      const items = [
        { _id: 1, test: true },
        { _id: 2, test: true },
        { _id: 3, test: true },
        { _id: 4, test: true }
      ]
      addItems(state, items)
      const itemsToRemove = [{ _id: 1, test: true }, { _id: 2, test: true }]
      removeItems(state, itemsToRemove)

      assert(state.ids.length === 2, 'should have 2 ids left')
      assert(
        Object.keys(state.keyedById).length === 2,
        'should have 2 items left'
      )
    })

    it('clearAll', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const item2 = {
        _id: 2,
        test: true
      }
      const items = [item1, item2]
      addItems(state, items)

      clearAll(state)
      assert(state.ids.length === 0)
      assert(Object.keys(state.keyedById).length === 0)
    })
  })

  describe('updateItem', function() {
    it('updates existing item when addOnUpsert=true', function() {
      const state = this.state
      state.addOnUpsert = true
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1].test === false)
    })

    it('updates existing item when addOnUpsert=false', function() {
      const state = this.state
      state.addOnUpsert = false
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1].test === false)
    })

    it('adds non-existing item when addOnUpsert=true', function() {
      const state = this.state
      state.addOnUpsert = true

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert.deepEqual(
        [state.addOnUpsert, state.ids, state.keyedById],
        [true, [1], { 1: { _id: 1, test: false } }]
      )
      // assert(state.keyedById[1].test === false)
    })

    it('discards non-existing item when addOnUpsert=false', function() {
      const state = this.state
      state.addOnUpsert = false

      const item1updated = {
        _id: 1,
        test: false
      }
      updateItem(state, item1updated)

      assert(state.keyedById[1] == null)
    })
  })

  describe('Vue event bindings', function() {
    it('does not break when attempting to overwrite a getter', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        get getter() {
          return 'Release the flying monkeys!'
        }
      }
      assertGetter(item1, 'getter', 'Release the flying monkeys!')
      const items = [item1]

      addItems(state, items)

      // Prove the getter is still in place in the store
      assertGetter(state.keyedById[1], 'getter', 'Release the flying monkeys!')

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.getter'() {
            console.log(state.keyedById)
            throw new Error('this should never happen')
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        getter: true
      }
      updateItem(state, updatedItem)

      assert(state.keyedById[1].getter === 'Release the flying monkeys!')
      done()
    })

    it('correctly emits events for existing array properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true,
        users: ['Marshall', 'Mariah']
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.users'() {
            assert(this.item.users.length === 3)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        test: false,
        users: ['Marshall', 'Mariah', 'Scooby Doo']
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new array properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.users'() {
            assert(this.item.users.length === 3)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        test: false,
        users: ['Marshall', 'Mariah', 'Scooby Doo']
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing object properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        obj: { test: true }
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.obj'() {
            assert(this.item.obj.test === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        obj: { test: false }
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new object properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.obj'() {
            assert(this.item.obj.test === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        obj: { test: false }
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing boolean properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        isValid: true
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.isValid'() {
            assert(this.item.isValid === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        isValid: false
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new boolean properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.isValid'() {
            assert(this.item.isValid === false)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        isValid: false
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing string properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: 'Marshall'
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new string properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing null properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: null
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === 'Xavier')
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: 'Xavier'
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for properties set to null', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        name: 'Marshall'
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.name'() {
            assert(this.item.name === null)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        name: null
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for existing number properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1,
        age: 45
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.age'() {
            assert(this.item.age === 50)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        age: 50
      }
      updateItem(state, updatedItem)
    })

    it('correctly emits events for new number properties', function(done) {
      const state = this.state
      const item1 = {
        _id: 1
      }
      const items = [item1]
      addItems(state, items)

      const vm = new Vue({
        data: {
          item: state.keyedById[1]
        },
        watch: {
          'item.age'() {
            assert(this.item.age === 50)
            done()
          }
        }
      })

      assert(vm.item, 'vm has item')

      const updatedItem = {
        _id: 1,
        age: 50
      }
      updateItem(state, updatedItem)
    })
  })

  describe('Copy & Commit', function() {
    it('createCopy', function() {
      const { state } = this
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)
      const original = state.keyedById[1]

      createCopy(state, item1._id)

      const copy = state.copiesById[item1._id]

      copy.setter = false
      assert(copy.getter === 'Life is a Joy!', `getter was preserved`)
      assert(copy.test === false, `copy was changed through setter`)
      assert(original.test === true, `original item intact after copy changed`)
    })

    it('resetCopy', function() {
      const { state } = this
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)

      // Create a copy and modify it.
      createCopy(state, item1._id)
      const copy = state.copiesById[item1._id]
      copy.test = false

      // Call resetCopy and check that it's back to the original value
      resetCopy(state, item1._id)
      assert(copy.test === true, 'the copy was reset')

      // Make sure accessors stayed intact
      assertGetter(copy, 'getter', 'Life is a Joy!')
      copy.setter = false
      assert(copy.test === false, 'the setter is intact')
    })

    it('commitCopy', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true,
        get getter() {
          return 'Life is a Joy!'
        },
        set setter(val) {
          this.test = val
        }
      }
      addItem(state, item1)
      const original = state.keyedById[item1._id]

      // Create a copy and modify it.
      createCopy(state, item1._id)
      const copy = state.copiesById[item1._id]
      copy.test = false

      commitCopy(state, item1._id)
      assert(copy.test === false, `the copy wasn't changed after commitCopy`)
      assert(original.test === false, 'original item updated after commitCopy')
    })

    it('clearCopy', function() {
      const state = this.state
      const item1 = {
        _id: 1,
        test: true
      }
      addItem(state, item1)

      // Create a copy then clear it.
      createCopy(state, item1._id)
      assert(state.copiesById[item1._id], `the copy is there!`)
      clearCopy(state, item1._id)
      assert(!state.copiesById[item1._id], `the copy is gone!`)
    })
  })

  describe('Pagination', function() {
    it('updatePaginationForQuery', function() {
      const state = this.state
      const qid = 'query-identifier'
      const query = { limit: 2 }
      const response = {
        data: [{ _id: 1, test: true }],
        limit: 2,
        skip: 0,
        total: 1
      }

      updatePaginationForQuery(state, { qid, response, query })

      const pageData = state.pagination[qid]
      assert(
        pageData.ids.length === 1,
        `the _id was added to the pagination ids`
      )
      assert(pageData.limit === 2, 'the limit was correct')
      assert(pageData.skip === 0, 'the skip was correct')
      assert(pageData.total === 1, 'the total was correct')
      assert.deepEqual(pageData.query, query, 'the query was stored')
    })
  })

  describe('Pending', function() {
    it('setPending && unsetPending', function() {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        assert(!state[`is${uppercaseMethod}Pending`])

        // Set pending & check
        setPending(state, method)
        assert(state[`is${uppercaseMethod}Pending`])

        // Unset pending & check
        unsetPending(state, method)
        assert(!state[`!is${uppercaseMethod}Pending`])
      })
    })
  })

  describe('Errors', function() {
    it('setError', function() {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        setError(state, { method, error: new Error('This is a test') })
        assert(state[`errorOn${uppercaseMethod}`].message)
        assert(state[`errorOn${uppercaseMethod}`].name)
        assert(state[`errorOn${uppercaseMethod}`].stack)
      })
    })

    it('setError with feathers-errors', function() {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)
        setError(state, {
          method,
          error: new errors.NotAuthenticated('You are not logged in')
        })
        assert(state[`errorOn${uppercaseMethod}`].className)
        assert(state[`errorOn${uppercaseMethod}`].code)
        assert(state[`errorOn${uppercaseMethod}`].hasOwnProperty('errors'))
        assert(state[`errorOn${uppercaseMethod}`].hasOwnProperty('data'))
        assert(state[`errorOn${uppercaseMethod}`].message)
        assert(state[`errorOn${uppercaseMethod}`].name)
        assert(state[`errorOn${uppercaseMethod}`].stack)
      })
    })

    it('clearError', function() {
      const state = this.state
      const methods = ['find', 'get', 'create', 'update', 'patch', 'remove']

      methods.forEach(method => {
        const uppercaseMethod = method.charAt(0).toUpperCase() + method.slice(1)

        setError(state, { method, error: new Error('This is a test') })
        clearError(state, method)
        assert(
          state[`errorOn${uppercaseMethod}`] === null,
          `errorOn${uppercaseMethod} was cleared`
        )
      })
    })
  })
})
