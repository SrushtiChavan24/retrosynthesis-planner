# Chem-Hack Helper 
An web application for the new chem-interns or for the students intreseted in chemistry to give them proper knowledge about the subject they adore
--Interactive Periodic Table--

Browse and explore all 119 elements through three interactive views:

**1. Periodic Table**
Standard periodic table grid (7×18) with all main elements, plus separate rows for lanthanides (elements 57-71) and actinides (elements 89-103). Click any element to view comprehensive details including atomic mass, electron configuration, and discovery history.

**2. Elements Property**
All elements organized by their chemical families (Alkali Metals, Transition Metals, Metalloids, Nonmetals, Halogens, Noble Gases, etc.). Click on any category to view all elements with their detailed properties:
- Basic Information: Symbol, Name, Atomic Number, Atomic Mass
- Physical Properties: Phase, Density, Melting Point, Boiling Point, Molar Heat
- Periodic Properties: Electronegativity, Ionization Energy, Electron Affinity
- Chemical Data: Block, Electron Configuration, Electron Shells
- Discovery & Source: Named By, Source
- Complete Description and Element Images (with attributions)

**3. Periodic Trends**
Visualize how element properties change across the periodic table with interactive charts showing:
- Electronegativity trends
- Ionization Energy patterns
- Electron Affinity values
- Atomic Radius variations

Statistics panel displays count and average values for all periodic properties. Select elements from the periodic table to view their complete details. 

**4. Retro Synthesis **
Run the backend


#### Download the data

##### 1) Download the building block molecules, pretrained models, and (optional) test data 

Download and unzip the files from this [link](https://www.dropbox.com/s/ar9cupb18hv96gj/retro_data.zip?dl=0), 
and put all the folders (```dataset/```, ```one_step_model/``` and ```saved_models/```) under the ```retro_star``` directory.

#### 3. Install Retro* lib

Install the retrosynthetic planning library with the following commands.

    pip install -e retro_star/packages/mlp_retrosyn
    pip install -e retro_star/packages/rdchiral
    pip install -e .

