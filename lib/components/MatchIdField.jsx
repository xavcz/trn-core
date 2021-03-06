import { registerComponent, Components, Actions } from 'meteor/nova:core';
import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import FRC from 'formsy-react-components';
// import Posts from "meteor/nova:posts";
import { connect } from 'react-redux'

const Input = FRC.Input;

class MatchIdField extends Component {

  constructor() {
    super();
    this.handleBlur = this.handleBlur.bind(this);
    this.state = {
      loading: false,
    }
    this.prefillFields = this.prefillFields.bind(this)
  }

  prefillFields(match) {
    //const slug = Telescope.utils.getUnusedSlug(Posts, match.displayName)
    this.context.addToAutofilledValues({
      title: match.displayName,
      //body: result.description,
      //thumbnailUrl: result.thumbnailUrl
    });
    this.setState({
      loading: false,
    })
  }

  // called whenever the URL input field loses focus
  handleBlur() {
    const { matches, loadMatch } = this.props



    const id = this.input.getValue();

    // controlled component per https://facebook.github.io/react/docs/forms.html#controlled-components
    // if (id !== this.state.value) {
    //   this.setState({ value: id, })
    // }

    if (id && id.length) {

      this.setState({
        loading: true,
      })

      // do we need this match
      if (!matches || !matches[id]) {
        loadMatch(id)
        console.log("waiting for match") // eslint-disable-line
      } else {
        this.prefillFields(matches[id])
      }
    }
  }

  componentDidUpdate(prevProps, prevState){

    // const { matches } = this.props
    // // hopefully this is our fetched match showing up
    // const id = this.state.value;
    //
    // if (id && id.length && this.state.loading) {
    //   if (matches && matches[id]) {
    //     this.prefillFields(matches[id])
    //   }
    // }
  }

  componentWillReceiveProps(nextProps) {
    const { matches } = this.props
    // hopefully this is our fetched match showing up
    const id = this.input.getValue();

    if (id && id.length && this.state.loading) {
      if (matches && matches[id]) {
        this.prefillFields(matches[id])
      }
    }
  }

  render() {

    const Loading = Components.Loading;

    const wrapperStyle = {
      position: "relative"
    };

    const loadingStyle = {
      position: "absolute",
      pointerEvents: "none",
      top: "15px",
      right: "15px"
    };

    loadingStyle.display = this.state.loading ? "block" : "none";

    // see https://facebook.github.io/react/warnings/unknown-prop.html
    const {document, updateCurrentValue, control, name} = this.props; // eslint-disable-line

    return (
      <div className="embedly-url-field" style={wrapperStyle}>
        <Input
          // value={this.state.value}
          name={name}
          onBlur={this.handleBlur}
          type="text"
          ref={ref => this.input = ref}
        />
        <div className="embedly-url-field-loading" style={loadingStyle}>
          <Loading />
        </div>
      </div>
    );
  }
}

MatchIdField.propTypes = {
  name: React.PropTypes.string,
  value: React.PropTypes.any,
  label: React.PropTypes.string,
  matches: React.PropTypes.object,
  dispatch: React.PropTypes.func,
}

MatchIdField.contextTypes = {
  addToAutofilledValues: React.PropTypes.func,
  throwError: React.PropTypes.func,
  actions: React.PropTypes.object,
}

const mapStateToProps = ({entities: { matches }}) => ({matches})
const mapDispatchToProps = dispatch => bindActionCreators({loadMatch: Actions.loadMatch}, dispatch);
//registerComponent('MatchIdField', MatchIdField, connect(mapStateToProps, mapDispatchToProps))
export default connect(mapStateToProps,mapDispatchToProps)(MatchIdField)
