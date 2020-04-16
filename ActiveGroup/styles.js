import styled from 'styled-components'

export const ActiveGroupComponent = styled.div`
  ${props => props.customStyles || ''}
`

export const ComponentWrapper = styled.div`
  ${props => props.customStyles || ''}
  height: 100%;
`
