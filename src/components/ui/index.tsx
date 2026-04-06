import React from 'react'

export const Placeholder: React.FC<{children?: React.ReactNode}> = ({children}) => (
  <div style={{padding:8,background:'#f7f7f7',border:'1px solid #eee'}}>
    {children}
  </div>
)

export default Placeholder
