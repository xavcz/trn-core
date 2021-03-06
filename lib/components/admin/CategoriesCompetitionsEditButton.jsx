import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { intlShape } from 'react-intl';
import { Button } from 'react-bootstrap';
import { withApollo } from 'react-apollo';

import { Components, registerComponent, getRawComponent, withEdit, withNew, withMessages, Actions, Utils } from 'meteor/nova:core';
import Categories from 'meteor/nova:categories';

class CategoriesCompetitionsEditButton extends Component {
  
  constructor(props) {
    super(props);
    this.fetchComp = this.fetchComp.bind(this);
    this.updateCategory = this.updateCategory.bind(this);
    this.updateTeams = this.updateTeams.bind(this);
    
    this.state = {
      loading: false,
    }
  }
  
  componentWillReceiveProps(nextProps, nextContext) {
    const { category, comp } = this.props;
    
    if (nextProps.comp[category.trnId] && !comp[category.trnId]) {
      const currentComp = nextProps.comp[category.trnId];
      
      this.updateCategory(currentComp);
      
      this.updateTeams(currentComp);
    }
  }
  
  async fetchComp() {
    const { category, loadCompetition, flash } = this.props;
    
    try {
      // console.log('fetch start');
      this.setState({loading: true});
      
      await loadCompetition(category.trnId, []);
      
      // console.log('fetch end');
      this.setState({loading: false});
      
      flash(`Competition "${category.name}" fetched!`, 'success');
    } catch(e) {
      flash(`Error fetching comp: ${e}`, "error");
    }
  }
  
  async updateCategory(comp) {
    const { category, editMutation, flash } = this.props;

    try {
      const { weightingFactor, abbr, teamIds } = comp;
      
      const mutationParams = {
        documentId: category._id,
        set: { 
          name: category.name, // needed even if we don't change it (category type definition)
          order: parseInt(weightingFactor * 100),
          abbr,
          image: `http://www.rugby.net/resources/comps/${abbr}/200.png`,
          trnTeamIds: teamIds,
        },
        unset: {}, // needed even if we don't "unset" anything (mutation utils process)
      };
      
      // console.log('mutation start');
      
      await editMutation(mutationParams);
      
      // console.log('mutation end');
      
      flash(`Competition "${category.name}" updated!`, 'success');
    } catch(e) {
      flash(`Error updating category: ${e}`, "error");
    }
  }
  
  async updateTeams(comp) {
    const { category, newMutation, flash, client } = this.props;
    try {
      const { teams } = comp;
      
      // console.log(teams);
      
      const uniqueTeams = teams.filter(team => {
        // get the current data of the store
        const apolloData = client.store.getState().apollo.data;
        
        // filter these data based on their typename: we are interested in the categories data
        const storedCategories = _.filter(apolloData, (object, key) => {
          return object.__typename === 'Category'
        });
                
        return !storedCategories.find(cat => cat.trnId === team.id)
      });
      
      // console.log(uniqueTeams);

      if (uniqueTeams.length) {
        const teamMutations = uniqueTeams.map(team => {
          const mutationParams = {
            document: {
              type: 'team',
              name: team.displayName,
              slug: Utils.slugify(team.displayName),
              description: team.groupInfo ? Utils.sanitize(team.groupInfo) : "",
              abbr: team.abbr,
              image: `http://www.rugby.net/resources/comps/${team.abbr}/200.png`,
              trnId: team.id,
              active: true,
              visible: true,
              order: 0,
            }
          };
          
          return newMutation(mutationParams);
        });
        
        
        for (const mutation of teamMutations) {
          await mutation;
        }
        
        flash(`${uniqueTeams.length} new teams created for competition "${category.name}"!`, 'success');
      } else {
        flash(`No new team created for competition "${category.name}".`, 'info');
      }
      
    } catch(e) {
      flash(`Error updating teams for ${category.name}: ${e}`, "error");
    }
  }
  
  render() {
    const { category, openCategoryEditModal } = this.props;
    
    const label = category.order ? 'Edit' : 'Init comp';
    const onClick = category.order && category.abbr ? openCategoryEditModal : this.fetchComp;
    
    if(!category || !category.trnId || category.type !== 'comp') {
      return <span>Error defining button</span>;
    }
      
    return (
      <Button className="posts-new-button" bsStyle="primary" disabled={this.state.loading} onClick={onClick}>
        {this.state.loading ? <Components.Loading /> : <span>{label}</span>}
      </Button>
    );
  }
}

CategoriesCompetitionsEditButton.displayName = "CategoriesCompetitionsEditButton";

CategoriesCompetitionsEditButton.defaultProps = {
  comp: {}, // will avoid errors of undefined propagation!
}

CategoriesCompetitionsEditButton.contextTypes = {
  intl: intlShape,
}

const options = {
  collection: Categories,
  fragment: getRawComponent('AdminPage').fragment,
};

const mapStateToProps = ({entities: { comp }}) => ({ comp });
const mapDispatchToProps = dispatch => bindActionCreators({loadCompetition: Actions.loadCompetition}, dispatch);

registerComponent('CategoriesCompetitionsEditButton', CategoriesCompetitionsEditButton, withMessages, withEdit(options), withNew(options), withApollo, connect(mapStateToProps, mapDispatchToProps));
