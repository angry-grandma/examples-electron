// https://github.com/tomkp/react-split-pane/blob/master/src/SplitPane.js

import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Pane from './Pane.js';
import Resizer from './Resizer.js';

class SplitPane extends Component {
    constructor(...args) {
        super(...args);

        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);

        this.state = {
            active: false,
            resized: false,
        };
    }

    componentDidMount() {
        this.setSize(this.props, this.state);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);
    }

    componentWillReceiveProps(props) {
        this.setSize(props, this.state);
    }

    componentWillUnmount() {
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousemove', this.onMouseMove);
    }

    onMouseDown(event) {
        if (this.props.allowResize && !this.props.size) {
            this.unFocus();
            const position = this.props.split === 'vertical' ? event.clientX : event.clientY;
            if (typeof this.props.onDragStarted === 'function') {
                this.props.onDragStarted();
            }
            this.setState({
                active: true,
                position,
            });
        }
    }

    onMouseMove(event) {
        if (this.props.allowResize && !this.props.size) {
            if (this.state.active) {
                this.unFocus();
                const isPrimaryFirst = this.props.primary === 'first';
                const ref = isPrimaryFirst ? this.refs.pane1 : this.refs.pane2;
                if (ref) {
                    const node = ReactDOM.findDOMNode(ref);

                    if (node.getBoundingClientRect) {
                        const width = node.getBoundingClientRect().width;
                        const height = node.getBoundingClientRect().height;
                        const current = this.props.split === 'vertical' ? event.clientX : event.clientY;
                        const size = this.props.split === 'vertical' ? width : height;
                        const position = this.state.position;
                        const newPosition = isPrimaryFirst ? (position - current) : (current - position);

                        let maxSize = this.props.maxSize;
                        if ((this.props.maxSize !== undefined) && (this.props.maxSize <= 0)) {
                            const splPane = ReactDOM.findDOMNode(this.refs.splitPane);
                            if (this.props.split === 'vertical') {
                                maxSize = splPane.getBoundingClientRect().width + this.props.maxSize;
                            } else {
                                maxSize = splPane.getBoundingClientRect().height + this.props.maxSize;
                            }
                        }

                        let newSize = size - newPosition;

                        if (newSize < this.props.minSize) {
                            newSize = this.props.minSize;
                        } else if ((this.props.maxSize !== undefined) && (newSize > maxSize)) {
                            newSize = maxSize;
                        } else {
                            this.setState({
                                position: current,
                                resized: true,
                            });
                        }

                        if (this.props.onChange) {
                            this.props.onChange(newSize);
                        }
                        this.setState({
                            draggedSize: newSize,
                        });
                        ref.setState({
                            size: newSize,
                        });
                    }
                }
            }
        }
    }

    onMouseUp() {
        if (this.props.allowResize && !this.props.size) {
            if (this.state.active) {
                if (typeof this.props.onDragFinished === 'function') {
                    this.props.onDragFinished();
                }
                this.setState({
                    active: false,
                });
            }
        }
    }

    setSize(props, state) {
        const ref = this.props.primary === 'first' ? this.refs.pane1 : this.refs.pane2;
        let newSize;
        if (ref) {
            newSize = props.size || (state && state.draggedSize) || props.defaultSize || props.minSize;
            ref.setState({
                size: newSize,
            });
        }
    }

    unFocus() {
        if (document.selection) {
            document.selection.empty();
        } else {
            window.getSelection().removeAllRanges();
        }
    }

    render() {
        const { split, allowResize } = this.props;
        let disabledClass = allowResize ? '' : 'disabled';

        const style = {
            display: 'flex',
            flex: 1,
            position: 'relative',
            outline: 'none',
            overflow: 'hidden',
            MozUserSelect: 'text',
            WebkitUserSelect: 'text',
            msUserSelect: 'text',
            userSelect: 'text',
        };

        if (split === 'vertical') {
            Object.assign(style, {
                flexDirection: 'row',
                height: '100%',
                position: 'absolute',
                left: 0,
                right: 0,
            });
        } else {
            Object.assign(style, {
                flexDirection: 'column',
                height: '100%',
                minHeight: '100%',
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '100%',
            });
        }

        const children = this.props.children;
        const classes = ['SplitPane', this.props.className, split, disabledClass];

        return (
            <div className={classes.join(' ')} style={style} ref="splitPane">
                <Pane ref="pane1" key="pane1" className="Pane1" split={split}>{children[0]}</Pane>
                <Resizer
                    ref="resizer"
                    key="resizer"
                    className={disabledClass}
                    onMouseDown={this.onMouseDown}
                    split={split}
                />
                <Pane ref="pane2" key="pane2" className="Pane2" split={split}>{children[1]}</Pane>
            </div>
        );
    }
}

SplitPane.propTypes = {
    primary: PropTypes.oneOf(['first', 'second']),
    minSize: PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    maxSize: PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    defaultSize: PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    size: PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
    ]),
    allowResize: PropTypes.bool,
    split: PropTypes.oneOf(['vertical', 'horizontal']),
    onDragStarted: PropTypes.func,
    onDragFinished: PropTypes.func,
    onChange: PropTypes.func,
    className: PropTypes.string,
    children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

SplitPane.defaultProps = {
    split: 'vertical',
    minSize: 50,
    allowResize: true,
    primary: 'first',
};

export default SplitPane;
