import React, { Component } from 'react'

import PropTypes from 'prop-types'

import * as S from './styles'

/**
 * I am calling these Ultra-HOCS -- HOCS that provide and manage props for a set of children rather than a singular child, got a better name?
 *
 * manages the active state of its children by managing and passing a boolean prop `isActive` to them and their nested component (or just the non-nested component)
 *
 * all children are assumed to have one nested child (typically this child is the prop managed),
 *    allowing for wrapping with a link or custom click handler div. Both components receive the `isActive` prop incase custom management is needed in both
 *
 * for no nesting (passing components directly as children, pass the `noNesting` prop)
 *
 * children can have an onClick prop, ActiveGroup will call this function with the primary child upon click if present
 */
class ActiveGroup extends Component {
  static propTypes = {
    noNesting: PropTypes.bool, // see above
    customStyles: PropTypes.string // custom styles to be applied to wrapping div
  }

  state = {
    components: [],
    activeId: null, // last active component id
    prevDefaultActive: 0
  }

  /* we actually need this now because passing via a mapped array passes an empty set first render then with props on re-render
   * thus nothing will actually get updated the first iteration
   */
  static getDerivedStateFromProps (props, state) {
    return ActiveGroup.generateState(props, state)
  }

  /**
   * generates the state (doesn't set, just returns) for the children components
   *
   * @param {*} props current props
   * @param {*} state current state
   */
  static generateState (props, state) {
    if (!props.children) {
      console.error('ActiveGroup props.children is undefined. Please pass > 1 child.')
    } else if (props.children.length === undefined) {
      console.error(
        'ActiveGroup cannot manage a single child, to wrap with styles pass the `customStyles` prop'
      )
    } else if (props.children.length === 0 || state.components?.length > 0) {
      /* (no error)
       * this is normal if children passed as mapped array (first condition)
       *
       * calculations have already been done for this set of children. (second condition)
       * for dynamically adding components this would have to be updated (second condition)
       *
       */
      return null
    } else {
      /* first time we received an array of children, create objects for use in renders */
      const components = ActiveGroup.generateComponentMap(props)

      return {
        components,
        activeId: props.defaultActive || 0,
        prevDefaultActive: props.defaultActive || 0
      }
    }
    /* error occured, didn't hit else block */
    return null
  }

  handleComponentClick = (component, event) => {
    const { activeId } = this.state

    if (activeId === component.id) return

    if (typeof component.onClick === typeof (() => {})) {
      component.onClick(component.component)
    }
    this.setState({ activeId: component.id })
  }

  deactivateGroup = event => this.setState({ activeId: null })

  static generateComponentMap = props => {
    const { children, noNesting } = props

    return children.map((link, componentPos) => {
      const component = {
        id: componentPos,
        parent: noNesting ? null : link,
        component: noNesting ? link : link.props.children,
        onClick: link.props.onClick
      }

      /* if undefined, they only passed children that were singular components & noNesting wasn't passed */
      if (component.component === undefined) {
        console.warn(
          'Primary Component to render in ActiveGroup is undefined, did you mean to use the `noNesting` prop? (currently assuming noNesting)'
        )
        /* assume that is what they wanted, otherwise we will error out */
        component.component = component.parent
        component.parent = null
      }

      return component
    })
  }

  componentDidUpdate () {
    const { defaultActive } = this.props
    const { prevDefaultActive } = this.state

    /** this is used for active groups that need to render based on a prop from refresh
     * for example all of our nav menus use this with an activeRoute to determine the defaultActive.
     * It is needed when a user clicks on something else that causes that prop to change, for example the logo link
     * this causes default active to be different, which is how we can detect change even though our group wasn't clicked
     */
    if (defaultActive !== prevDefaultActive) {
      this.setState({ prevDefaultActive: defaultActive, activeId: defaultActive })
    }
  }

  render () {
    const { noNesting, customComponentStyles } = this.props
    const { activeId } = this.state

    /* this fixes issues causing prop updates to not be passed to children */
    const components = ActiveGroup.generateComponentMap(this.props)

    const Components = components.map(component => {
      const isActive = activeId !== undefined ? component.id === activeId : false

      const newComponentProps = { ...component.component.props, isActive, customComponentStyles }
      const Component = React.cloneElement(component.component, newComponentProps)

      const Parent =
        noNesting || !component.parent // handles noNesting assumption
          ? null
          : React.cloneElement(
            component.parent,
            { ...component.parent.props, isActive },
            Component /* pass new component as the new child */
          )

      return (
        <S.ComponentWrapper
          {...newComponentProps}
          key={component.id}
          onClick={() => this.handleComponentClick(component)}
        >
          {Parent || Component}
        </S.ComponentWrapper>
      )
    })

    return <S.ActiveGroupComponent {...this.props}>{Components}</S.ActiveGroupComponent>
  }
}

export default ActiveGroup
